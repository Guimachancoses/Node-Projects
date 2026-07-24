import { randomBytes } from 'node:crypto';

import { AppError } from './errors.js';

const SESSION_COOKIE_NAME = 'garbuio_portal_session';

export interface SessionContext {
  readonly baseDate: string;
  readonly branch: string;
  readonly branchName: string;
}

export interface AuthSession {
  readonly userName: string;
  readonly companyGroup: '01';
  readonly context: SessionContext | null;
}

interface StoredSession extends AuthSession {
  readonly id: string;
  readonly expiresAt: number;
}

interface LoginAttempt {
  readonly attempts: number;
  readonly startedAt: number;
}

function cookieValue(cookieHeader: string | undefined, name: string): string {
  if (!cookieHeader) {
    return '';
  }

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return '';
}

export function parseBasicCredentials(header: string | undefined): {
  readonly userName: string;
  readonly password: string;
} {
  const [scheme = '', encoded = ''] = header?.trim().split(/\s+/, 2) ?? [];
  if (scheme.toLocaleLowerCase('en-US') !== 'basic' || !encoded) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Informe usuário e senha do Protheus.');
  }

  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas.');
  }

  const separator = decoded.indexOf(':');
  const userName = separator >= 0 ? decoded.slice(0, separator).trim() : '';
  const password = separator >= 0 ? decoded.slice(separator + 1) : '';
  if (!userName || !password || userName.length > 100 || password.length > 256) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas.');
  }
  return { userName, password };
}

export class AuthSessionStore {
  private readonly sessions = new Map<string, StoredSession>();

  constructor(private readonly ttlMs: number) {}

  create(userName: string): { readonly id: string; readonly session: AuthSession } {
    const id = randomBytes(32).toString('base64url');
    const stored: StoredSession = {
      id,
      userName,
      companyGroup: '01',
      context: null,
      expiresAt: Date.now() + this.ttlMs,
    };
    this.sessions.set(id, stored);
    return { id, session: this.publicSession(stored) };
  }

  read(cookieHeader: string | undefined): AuthSession | null {
    const id = cookieValue(cookieHeader, SESSION_COOKIE_NAME);
    const stored = id ? this.sessions.get(id) : undefined;
    if (!stored) {
      return null;
    }
    if (stored.expiresAt <= Date.now()) {
      this.sessions.delete(id);
      return null;
    }

    const refreshed: StoredSession = {
      ...stored,
      expiresAt: Date.now() + this.ttlMs,
    };
    this.sessions.set(id, refreshed);
    return this.publicSession(refreshed);
  }

  updateContext(cookieHeader: string | undefined, context: SessionContext): AuthSession {
    const id = cookieValue(cookieHeader, SESSION_COOKIE_NAME);
    const stored = id ? this.sessions.get(id) : undefined;
    if (!stored || stored.expiresAt <= Date.now()) {
      if (id) {
        this.sessions.delete(id);
      }
      throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Sua sessão expirou. Entre novamente.');
    }

    const updated: StoredSession = {
      ...stored,
      context,
      expiresAt: Date.now() + this.ttlMs,
    };
    this.sessions.set(id, updated);
    return this.publicSession(updated);
  }

  delete(cookieHeader: string | undefined): void {
    const id = cookieValue(cookieHeader, SESSION_COOKIE_NAME);
    if (id) {
      this.sessions.delete(id);
    }
  }

  cookie(id: string, secure: boolean): string {
    return [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(id)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${Math.floor(this.ttlMs / 1_000)}`,
      ...(secure ? ['Secure'] : []),
    ].join('; ');
  }

  clearCookie(secure: boolean): string {
    return [
      `${SESSION_COOKIE_NAME}=`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=0',
      ...(secure ? ['Secure'] : []),
    ].join('; ');
  }

  private publicSession(session: StoredSession): AuthSession {
    return {
      userName: session.userName,
      companyGroup: session.companyGroup,
      context: session.context,
    };
  }
}

export class LoginAttemptLimiter {
  private readonly attempts = new Map<string, LoginAttempt>();

  constructor(
    private readonly maximumAttempts: number,
    private readonly windowMs: number,
  ) {}

  assertAllowed(key: string): void {
    const attempt = this.current(key);
    if (attempt && attempt.attempts >= this.maximumAttempts) {
      throw new AppError(
        429,
        'TOO_MANY_REQUESTS',
        'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.',
      );
    }
  }

  failure(key: string): void {
    const attempt = this.current(key);
    this.attempts.set(key, {
      attempts: (attempt?.attempts ?? 0) + 1,
      startedAt: attempt?.startedAt ?? Date.now(),
    });
  }

  success(key: string): void {
    this.attempts.delete(key);
  }

  private current(key: string): LoginAttempt | null {
    const attempt = this.attempts.get(key);
    if (!attempt) {
      return null;
    }
    if (attempt.startedAt + this.windowMs <= Date.now()) {
      this.attempts.delete(key);
      return null;
    }
    return attempt;
  }
}
