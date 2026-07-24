import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTH_SESSION_EXPIRED'
  | 'BUSINESS_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'EMPTY_RESPONSE'
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'PROTHEUS_AUTH_ERROR'
  | 'SESSION_CONTEXT_REQUIRED'
  | 'TIMEOUT'
  | 'TOO_MANY_REQUESTS'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_INVALID_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiError {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly status?: number;
}

export class ApiOperationError extends Error {
  constructor(readonly detail: ApiError) {
    super(detail.message);
    this.name = 'ApiOperationError';
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiOperationError) {
    return error.detail;
  }

  if (error instanceof HttpErrorResponse) {
    const detail = httpErrorDetail(error.error);

    return {
      code: detail?.code ?? 'HTTP_ERROR',
      message: detail?.message ?? extractHttpMessage(error),
      status: error.status,
    };
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return {
      code: 'TIMEOUT',
      message: 'A operação excedeu o tempo limite. Tente novamente.',
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Não foi possível concluir a operação.',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Não foi possível concluir a operação.',
  };
}

function extractHttpMessage(error: HttpErrorResponse): string {
  const body: unknown = error.error;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (isMessageRecord(body)) {
    return body['message'];
  }

  return error.message || 'Falha de comunicação com o Garbuio Portal.';
}

function isMessageRecord(value: unknown): value is Record<'message', string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

function httpErrorDetail(value: unknown): Pick<ApiError, 'code' | 'message'> | null {
  if (!isMessageRecord(value) || !('code' in value) || typeof value.code !== 'string') {
    return null;
  }

  return {
    code: isApiErrorCode(value.code) ? value.code : 'HTTP_ERROR',
    message: value.message,
  };
}

function isApiErrorCode(value: string): value is ApiErrorCode {
  return [
    'AUTH_SESSION_EXPIRED',
    'AUTHENTICATION_REQUIRED',
    'BUSINESS_ERROR',
    'CONFIGURATION_ERROR',
    'EMPTY_RESPONSE',
    'HTTP_ERROR',
    'INVALID_RESPONSE',
    'INVALID_CREDENTIALS',
    'NOT_FOUND',
    'PROTHEUS_AUTH_ERROR',
    'SESSION_CONTEXT_REQUIRED',
    'TIMEOUT',
    'TOO_MANY_REQUESTS',
    'UPSTREAM_ERROR',
    'UPSTREAM_INVALID_RESPONSE',
    'VALIDATION_ERROR',
    'UNKNOWN_ERROR',
  ].includes(value);
}
