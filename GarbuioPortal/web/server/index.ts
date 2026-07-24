import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

import {
  AuthSession,
  AuthSessionStore,
  LoginAttemptLimiter,
  parseBasicCredentials,
} from './auth-session.js';
import { serverConfig } from './config.js';
import { OrderFilter, OrderStatus, PageSize } from './contracts.js';
import { AppError, toAppError } from './errors.js';
import { BranchOption, OrderService } from './order-service.js';
import { ProtheusClient } from './protheus-client.js';
import {
  parseLookupType,
  parseSaveOrderRequest,
  parseSaveSupplyRequest,
  requiredRouteValue,
  sequenceValue,
} from './validation.js';

type AsyncHandler = (request: Request, response: Response) => Promise<void>;

const asyncRoute = (handler: AsyncHandler): RequestHandler => {
  return (request, response, next): void => {
    void handler(request, response).catch(next);
  };
};

function queryText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredDate(value: unknown, name: string): string {
  const normalized = queryText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${name} deve estar no formato AAAA-MM-DD.`);
  }
  const [yearText = '', monthText = '', dayText = ''] = normalized.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new AppError(400, 'VALIDATION_ERROR', `${name} contém uma data inválida.`);
  }
  return normalized;
}

function queryStatus(value: unknown): OrderStatus {
  const normalized = queryText(value);
  if (normalized === '' || normalized === 'P' || normalized === 'C' || normalized === 'L') {
    return normalized;
  }
  throw new AppError(400, 'VALIDATION_ERROR', 'Situação inválida.');
}

function queryInteger(value: unknown, name: string): number {
  const number = Number(queryText(value));
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${name} inválido.`);
  }
  return number;
}

function queryPage(value: unknown): number {
  if (value === undefined) {
    return 1;
  }
  const page = queryInteger(value, 'page');
  if (page < 1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'page deve iniciar em 1.');
  }
  return page;
}

function queryPageSize(value: unknown): PageSize {
  if (value === undefined) {
    return 10;
  }
  const pageSize = queryInteger(value, 'pageSize');
  if (pageSize !== 10 && pageSize !== 50 && pageSize !== 100) {
    throw new AppError(400, 'VALIDATION_ERROR', 'pageSize deve ser 10, 50 ou 100.');
  }
  return pageSize;
}

function currentLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const client = new ProtheusClient(serverConfig);
const orderService = new OrderService(client, serverConfig);
const sessionStore = new AuthSessionStore(serverConfig.sessionTtlMinutes * 60_000);
const loginLimiter = new LoginAttemptLimiter(
  serverConfig.loginMaxAttempts,
  serverConfig.loginWindowMinutes * 60_000,
);
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb', strict: true }));

function requiredSession(request: Request): AuthSession {
  const session = sessionStore.read(request.headers.cookie);
  if (!session) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Sua sessão expirou. Entre novamente.');
  }
  return session;
}

function requiredContext(request: Request): NonNullable<AuthSession['context']> {
  const session = requiredSession(request);
  if (!session.context) {
    throw new AppError(
      409,
      'SESSION_CONTEXT_REQUIRED',
      'Selecione a data-base e a filial antes de continuar.',
    );
  }
  return session.context;
}

async function authBootstrap(
  session: AuthSession,
  existingBranches?: ReadonlyArray<BranchOption>,
): Promise<object> {
  return {
    session,
    branches: existingBranches ?? (await orderService.contextOptions()),
    defaultBaseDate: currentLocalDate(),
  };
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

app.use('/api', (request, _response, next) => {
  if (
    request.method === 'GET' ||
    request.method === 'HEAD' ||
    request.method === 'OPTIONS' ||
    request.header('X-Requested-With') === 'XMLHttpRequest'
  ) {
    next();
    return;
  }
  next(new AppError(403, 'AUTHENTICATION_REQUIRED', 'Requisição de origem não permitida.'));
});

app.post(
  '/api/auth/login',
  asyncRoute(async (request, response) => {
    const credentials = parseBasicCredentials(request.header('Authorization'));
    const limiterKey = `${request.ip ?? 'unknown'}:${credentials.userName.toLocaleLowerCase(
      'en-US',
    )}`;
    loginLimiter.assertAllowed(limiterKey);

    try {
      await client.authenticateCredentials(credentials.userName, credentials.password);
      loginLimiter.success(limiterKey);
    } catch (error: unknown) {
      const appError = toAppError(error);
      if (appError.code === 'INVALID_CREDENTIALS') {
        loginLimiter.failure(limiterKey);
      }
      throw appError;
    }

    const created = sessionStore.create(credentials.userName);
    response.setHeader(
      'Set-Cookie',
      sessionStore.cookie(created.id, serverConfig.secureSessionCookie),
    );
    response.status(201).json(await authBootstrap(created.session));
  }),
);

app.get(
  '/api/auth/session',
  asyncRoute(async (request, response) => {
    response.json(await authBootstrap(requiredSession(request)));
  }),
);

app.put(
  '/api/auth/context',
  asyncRoute(async (request, response) => {
    requiredSession(request);
    if (!isJsonRecord(request.body)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'O contexto deve ser informado.');
    }

    const baseDate = requiredDate(request.body['baseDate'], 'baseDate');
    const branch = requiredRouteValue(request.body['branch'], 'branch');
    const branches = await orderService.contextOptions();
    const selectedBranch = branches.find((option) => option.value === branch);
    if (!selectedBranch) {
      throw new AppError(400, 'VALIDATION_ERROR', 'A filial selecionada não é válida.');
    }

    const session = sessionStore.updateContext(request.headers.cookie, {
      baseDate,
      branch,
      branchName: selectedBranch.label,
    });
    response.json(await authBootstrap(session, branches));
  }),
);

app.delete('/api/auth/session', (request, response) => {
  sessionStore.delete(request.headers.cookie);
  response.setHeader('Set-Cookie', sessionStore.clearCookie(serverConfig.secureSessionCookie));
  response.status(204).send();
});

app.use('/api/protheus', (request, _response, next) => {
  try {
    requiredContext(request);
    next();
  } catch (error: unknown) {
    next(error);
  }
});

app.get(
  '/api/protheus/health',
  asyncRoute(async (_request, response) => {
    await client.healthCheck();
    response.json({ status: 'ok', companyId: serverConfig.companyId });
  }),
);

app.get(
  '/api/protheus/reference-data',
  asyncRoute(async (request, response) => {
    const context = requiredContext(request);
    response.json(await orderService.referenceData(context.branch, context.baseDate));
  }),
);

app.get(
  '/api/protheus/orders',
  asyncRoute(async (request, response) => {
    const filter: OrderFilter = {
      startDate: requiredDate(request.query['startDate'], 'startDate'),
      endDate: requiredDate(request.query['endDate'], 'endDate'),
      branch: requiredRouteValue(queryText(request.query['branch']), 'branch'),
      status: queryStatus(request.query['status']),
      order: queryText(request.query['order']),
      plate: queryText(request.query['plate']),
    };
    response.json(
      await orderService.searchOrders(
        filter,
        queryPage(request.query['page']),
        queryPageSize(request.query['pageSize']),
      ),
    );
  }),
);

app.get(
  '/api/protheus/orders/new',
  asyncRoute(async (request, response) => {
    const session = requiredSession(request);
    const context = requiredContext(request);
    response.json(
      await orderService.newOrder(context.baseDate, context.branch, session.userName),
    );
  }),
);

app.get(
  '/api/protheus/orders/:branch/:order',
  asyncRoute(async (request, response) => {
    const branch = requiredRouteValue(request.params['branch'], 'branch');
    const order = requiredRouteValue(request.params['order'], 'order');
    response.json(await orderService.orderEditor(branch, order));
  }),
);

app.post(
  '/api/protheus/orders',
  asyncRoute(async (request, response) => {
    const command = parseSaveOrderRequest(request.body as unknown);
    if (command.mode !== 'create') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Esta rota aceita somente inclusão.');
    }
    const session = requiredSession(request);
    response.status(201).json(
      await orderService.saveOrder({
        mode: 'create',
        value: {
          ...command.value,
          inclusionUser: session.userName,
          changeUser: '',
        },
      }),
    );
  }),
);

app.put(
  '/api/protheus/orders/:branch/:order',
  asyncRoute(async (request, response) => {
    const branch = requiredRouteValue(request.params['branch'], 'branch');
    const order = requiredRouteValue(request.params['order'], 'order');
    const command = parseSaveOrderRequest(request.body as unknown);
    if (
      command.mode !== 'update' ||
      command.value.branch !== branch ||
      command.value.order !== order
    ) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Filial, ordem ou modo divergente da rota de alteração.',
      );
    }
    response.json(await orderService.saveOrder(command));
  }),
);

app.get(
  '/api/protheus/orders/:branch/:order/supplies/editor',
  asyncRoute(async (request, response) => {
    const branch = requiredRouteValue(request.params['branch'], 'branch');
    const order = requiredRouteValue(request.params['order'], 'order');
    const orderServiceId = queryInteger(request.query['orderServiceId'], 'orderServiceId');
    const sequenceQuery = queryText(request.query['sequence']);
    const sequence = sequenceQuery ? queryInteger(sequenceQuery, 'sequence') : undefined;
    response.json(await orderService.supplyEditor(branch, order, orderServiceId, sequence));
  }),
);

app.post(
  '/api/protheus/orders/:branch/:order/supplies',
  asyncRoute(async (request, response) => {
    const branch = requiredRouteValue(request.params['branch'], 'branch');
    const order = requiredRouteValue(request.params['order'], 'order');
    const command = parseSaveSupplyRequest(request.body as unknown);
    if (
      command.mode !== 'create' ||
      command.value.branch !== branch ||
      command.value.order !== order
    ) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Filial, ordem ou modo divergente da rota de inclusão do insumo.',
      );
    }
    response.status(201).json(await orderService.saveSupply(command));
  }),
);

app.put(
  '/api/protheus/orders/:branch/:order/supplies/:sequence',
  asyncRoute(async (request, response) => {
    const branch = requiredRouteValue(request.params['branch'], 'branch');
    const order = requiredRouteValue(request.params['order'], 'order');
    const sequence = sequenceValue(request.params['sequence']);
    const command = parseSaveSupplyRequest(request.body as unknown);
    if (
      command.mode !== 'update' ||
      command.value.branch !== branch ||
      command.value.order !== order ||
      command.value.sequence !== sequence
    ) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Filial, ordem, sequência ou modo divergente da rota de alteração do insumo.',
      );
    }
    response.json(await orderService.saveSupply(command));
  }),
);

app.delete(
  '/api/protheus/orders/:branch/:order/supplies/:sequence',
  asyncRoute(async (request, response) => {
    const branch = requiredRouteValue(request.params['branch'], 'branch');
    const order = requiredRouteValue(request.params['order'], 'order');
    const sequence = sequenceValue(request.params['sequence']);
    const orderServiceId = queryInteger(request.query['orderServiceId'], 'orderServiceId');
    await orderService.deleteSupply(branch, order, orderServiceId, sequence);
    response.status(204).send();
  }),
);

app.get(
  '/api/protheus/lookups/:type',
  asyncRoute(async (request, response) => {
    response.json(
      await orderService.lookup(
        {
          type: parseLookupType(requiredRouteValue(request.params['type'], 'type')),
          filter: queryText(request.query['filter']),
          query: queryText(request.query['query']),
        },
        queryPage(request.query['page']),
        queryPageSize(request.query['pageSize']),
      ),
    );
  }),
);

app.use((_request, response) => {
  response.status(404).json({
    code: 'NOT_FOUND',
    message: 'Rota da integração não encontrada.',
  });
});

const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  const appError = toAppError(error);
  response.status(appError.status).json({
    code: appError.code,
    message: appError.message,
  });
};

app.use(errorHandler);

app.listen(serverConfig.port, '127.0.0.1', () => {
  console.info(`BFF Protheus disponível em http://127.0.0.1:${serverConfig.port}`);
});
