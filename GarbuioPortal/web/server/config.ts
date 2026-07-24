import 'dotenv/config';

import { AppError } from './errors.js';

export interface ServerConfig {
  readonly port: number;
  readonly companyId: number;
  readonly baseUrl: string;
  readonly username: string;
  readonly password: string;
  readonly defaultUserCode: string;
  readonly requestTimeoutMs: number;
  readonly pageSize: number;
  readonly maxPages: number;
  readonly sessionTtlMinutes: number;
  readonly loginMaxAttempts: number;
  readonly loginWindowMinutes: number;
  readonly secureSessionCookie: boolean;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError(
      500,
      'CONFIGURATION_ERROR',
      `A variável de ambiente ${name} não foi configurada.`,
    );
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new AppError(
      500,
      'CONFIGURATION_ERROR',
      `A variável de ambiente ${name} deve ser um número inteiro positivo.`,
    );
  }
  return value;
}

function normalizedBaseUrl(): string {
  const value = required('PROTHEUS_BASE_URL').replace(/\/+$/, '');
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new AppError(
      500,
      'CONFIGURATION_ERROR',
      'A variável PROTHEUS_BASE_URL não contém uma URL válida.',
    );
  }

  if (url.protocol !== 'https:') {
    throw new AppError(500, 'CONFIGURATION_ERROR', 'PROTHEUS_BASE_URL deve utilizar HTTPS.');
  }

  return url.toString().replace(/\/+$/, '');
}

function booleanValue(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLocaleLowerCase('en-US');
  if (!raw) {
    return fallback;
  }
  if (raw === 'true' || raw === '1') {
    return true;
  }
  if (raw === 'false' || raw === '0') {
    return false;
  }
  throw new AppError(
    500,
    'CONFIGURATION_ERROR',
    `A variável de ambiente ${name} deve ser true ou false.`,
  );
}

export const serverConfig: ServerConfig = Object.freeze({
  port: positiveInteger('PORT', 3000),
  companyId: positiveInteger('PROTHEUS_ID_EMPRESA', 1),
  baseUrl: normalizedBaseUrl(),
  username: required('PROTHEUS_API_USERNAME'),
  password: required('PROTHEUS_API_PASSWORD'),
  defaultUserCode: process.env['PROTHEUS_DEFAULT_USER_CODE']?.trim() ?? '',
  requestTimeoutMs: positiveInteger('PROTHEUS_REQUEST_TIMEOUT_MS', 30_000),
  pageSize: positiveInteger('PROTHEUS_PAGE_SIZE', 100),
  maxPages: positiveInteger('PROTHEUS_MAX_PAGES', 20),
  sessionTtlMinutes: positiveInteger('SESSION_TTL_MINUTES', 480),
  loginMaxAttempts: positiveInteger('LOGIN_MAX_ATTEMPTS', 5),
  loginWindowMinutes: positiveInteger('LOGIN_WINDOW_MINUTES', 15),
  secureSessionCookie: booleanValue('SESSION_COOKIE_SECURE', false),
});
