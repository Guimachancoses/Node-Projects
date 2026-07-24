import { ServerConfig } from './config.js';
import { CorrectiveOrderPayload, ProtheusRecord } from './contracts.js';
import { AppError } from './errors.js';

interface CachedToken {
  readonly value: string;
  readonly expiresAt: number;
}

interface CachedEstablishments {
  readonly items: ReadonlyArray<ProtheusRecord>;
  readonly expiresAt: number;
}

export interface GenericQuery {
  readonly table: string;
  readonly fields: string;
  readonly where: string;
}

export interface GenericQueryPage {
  readonly items: ReadonlyArray<ProtheusRecord>;
  readonly hasNext: boolean;
}

interface RequestOptions {
  readonly method?: 'GET' | 'POST';
  readonly body?: string;
}

function isRecord(value: unknown): value is ProtheusRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringProperty(source: ProtheusRecord, property: string): string {
  const value = source[property];
  return typeof value === 'string' ? value.trim() : '';
}

function numberProperty(source: ProtheusRecord, property: string): number {
  const value = source[property];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function booleanProperty(source: ProtheusRecord, property: string): boolean {
  const value = source[property];
  return value === true || value === 1 || value === '1' || value === 'true';
}

export class ProtheusClient {
  private token: CachedToken | null = null;
  private tokenRequest: Promise<string> | null = null;
  private establishmentCache: CachedEstablishments | null = null;
  private establishmentRequest: Promise<ReadonlyArray<ProtheusRecord>> | null = null;

  constructor(private readonly config: ServerConfig) {}

  async healthCheck(): Promise<void> {
    await this.getAccessToken();
  }

  async authenticateCredentials(userName: string, password: string): Promise<void> {
    await this.requestToken(userName, password, true);
  }

  async establishments(): Promise<ReadonlyArray<ProtheusRecord>> {
    const now = Date.now();
    if (this.establishmentCache && this.establishmentCache.expiresAt > now) {
      return this.establishmentCache.items;
    }

    if (!this.establishmentRequest) {
      this.establishmentRequest = this.requestEstablishments().finally(() => {
        this.establishmentRequest = null;
      });
    }
    return this.establishmentRequest;
  }

  async genericQuery(query: GenericQuery): Promise<ReadonlyArray<ProtheusRecord>> {
    const records: Array<ProtheusRecord> = [];

    for (let page = 1; page <= this.config.maxPages; page += 1) {
      const result = await this.genericQueryPage(query, page, this.config.pageSize);
      records.push(...result.items);

      if (!result.hasNext || result.items.length === 0) {
        return records;
      }
    }

    throw new AppError(
      502,
      'UPSTREAM_INVALID_RESPONSE',
      'A consulta do Protheus excedeu o limite seguro de páginas.',
    );
  }

  async genericQueryPage(
    query: GenericQuery,
    page: number,
    pageSize = this.config.pageSize,
  ): Promise<GenericQueryPage> {
    const url = this.apiUrl('/rest01/api/framework/v1/genericQuery');
    url.searchParams.set('tables', query.table);
    url.searchParams.set('fields', query.fields);
    url.searchParams.set('where', query.where);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('pagesize', pageSize.toString());

    const response = await this.authorizedRequest(url);
    const envelope = this.responseRecord(response);
    const items = envelope['items'];
    return {
      items: Array.isArray(items) ? items.filter(isRecord) : [],
      hasNext: booleanProperty(envelope, 'hasNext'),
    };
  }

  async correctiveOrders(
    branch: string,
    startDate: string,
    endDate: string,
    order: string,
    status: string,
  ): Promise<ReadonlyArray<ProtheusRecord>> {
    const records: Array<ProtheusRecord> = [];

    for (let page = 1; page <= this.config.maxPages; page += 1) {
      const url = this.apiUrl('/rest01/api/v1/CorrectiveServiceOrder');
      url.searchParams.set('filial', branch);
      url.searchParams.set('datainicial', startDate.replace(/\D/g, ''));
      url.searchParams.set('datafinal', endDate.replace(/\D/g, ''));
      if (order) {
        url.searchParams.set('ordem', order);
      }
      if (status) {
        url.searchParams.set('situacao', status);
      }
      url.searchParams.set('page', page.toString());
      url.searchParams.set('pageSize', this.config.pageSize.toString());

      const response = await this.authorizedRequest(url);
      const envelope = this.responseRecord(response);
      const items = envelope['items'];

      if (Array.isArray(items)) {
        records.push(...items.filter(isRecord));
      }

      if (!booleanProperty(envelope, 'hasNext')) {
        return records;
      }
    }

    throw new AppError(
      502,
      'UPSTREAM_INVALID_RESPONSE',
      'A consulta de ordens excedeu o limite seguro de páginas.',
    );
  }

  async saveCorrectiveOrder(
    payload: CorrectiveOrderPayload,
    branch?: string,
    order?: string,
  ): Promise<ProtheusRecord> {
    const url = this.apiUrl('/rest01/api/v1/CorrectiveServiceOrder');

    if (branch && order) {
      url.searchParams.set('filial', branch);
      url.searchParams.set('numOS', order);
    }

    const response = await this.authorizedRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.responseRecord(response);
  }

  private async authorizedRequest(
    url: URL,
    options: RequestOptions = {},
    retryAuthentication = true,
  ): Promise<unknown> {
    const token = await this.getAccessToken();
    const response = await this.fetchJson(url, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });

    if (response.status === 401 && retryAuthentication) {
      this.token = null;
      return this.authorizedRequest(url, options, false);
    }

    if (!response.ok) {
      throw this.upstreamError(response.status, response.body);
    }

    return response.body;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 60_000) {
      return this.token.value;
    }

    if (!this.tokenRequest) {
      this.tokenRequest = this.requestAccessToken().finally(() => {
        this.tokenRequest = null;
      });
    }

    return this.tokenRequest;
  }

  private async requestAccessToken(): Promise<string> {
    const token = await this.requestToken(this.config.username, this.config.password, false);
    this.token = token;
    return token.value;
  }

  private async requestToken(
    userName: string,
    password: string,
    userAuthentication: boolean,
  ): Promise<CachedToken> {
    const url = this.apiUrl('/rest01/api/oauth2/v1/token');
    const basicCredentials = Buffer.from(`${userName}:${password}`, 'utf8').toString('base64');
    const body = new URLSearchParams({
      grant_type: 'password',
      username: userName,
      password,
    }).toString();

    const response = await this.fetchJson(url, {
      method: 'POST',
      body,
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${basicCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      if (userAuthentication && (response.status === 400 || response.status === 401)) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuário ou senha inválidos.');
      }
      throw new AppError(
        502,
        'PROTHEUS_AUTH_ERROR',
        'O Protheus recusou a autenticação da integração.',
      );
    }

    const envelope = this.responseRecord(response.body);
    const token = stringProperty(envelope, 'access_token');
    if (!token) {
      throw new AppError(
        502,
        'UPSTREAM_INVALID_RESPONSE',
        'O Protheus não retornou um token de acesso válido.',
      );
    }

    const expiresIn = Math.max(numberProperty(envelope, 'expires_in'), 300);
    return {
      value: token,
      expiresAt: Date.now() + expiresIn * 1_000,
    };
  }

  private async requestEstablishments(): Promise<ReadonlyArray<ProtheusRecord>> {
    const response = await this.authorizedRequest(this.apiUrl('/restmeurh01/establishment'));
    if (!Array.isArray(response) || response.some((item) => !isRecord(item))) {
      throw new AppError(
        502,
        'UPSTREAM_INVALID_RESPONSE',
        'O Protheus retornou uma lista de filiais inválida.',
      );
    }

    const items = response.filter(isRecord);
    this.establishmentCache = {
      items,
      expiresAt: Date.now() + 5 * 60_000,
    };
    return items;
  }

  private async fetchJson(
    url: URL,
    init: {
      readonly method: 'GET' | 'POST';
      readonly headers: Readonly<Record<string, string>>;
      readonly body?: string;
    },
  ): Promise<{ readonly ok: boolean; readonly status: number; readonly body: unknown }> {
    let response: Response;

    try {
      response = await fetch(url, {
        method: init.method,
        headers: init.headers,
        body: init.body,
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });
    } catch (error: unknown) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      throw new AppError(
        502,
        'UPSTREAM_ERROR',
        timedOut
          ? 'A requisição ao Protheus excedeu o tempo limite.'
          : 'Não foi possível conectar ao Protheus.',
      );
    }

    const text = await response.text();
    let body: unknown = null;

    if (text.trim()) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }

    return { ok: response.ok, status: response.status, body };
  }

  private responseRecord(value: unknown): ProtheusRecord {
    if (!isRecord(value)) {
      throw new AppError(
        502,
        'UPSTREAM_INVALID_RESPONSE',
        'O Protheus retornou uma resposta vazia ou inválida.',
      );
    }
    return value;
  }

  private upstreamError(status: number, body: unknown): AppError {
    const message = isRecord(body)
      ? stringProperty(body, 'message') ||
        stringProperty(body, 'faultstring') ||
        stringProperty(body, 'error_description')
      : '';

    return new AppError(
      502,
      'UPSTREAM_ERROR',
      message ? `Protheus: ${message}` : `O Protheus retornou HTTP ${status}.`,
    );
  }

  private apiUrl(path: string): URL {
    return new URL(path, `${this.config.baseUrl}/`);
  }
}
