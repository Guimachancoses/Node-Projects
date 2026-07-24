export type ServerErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'CONFIGURATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'PROTHEUS_AUTH_ERROR'
  | 'SESSION_CONTEXT_REQUIRED'
  | 'TOO_MANY_REQUESTS'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_INVALID_RESPONSE'
  | 'VALIDATION_ERROR';

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ServerErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    500,
    'UPSTREAM_ERROR',
    error instanceof Error && error.message
      ? error.message
      : 'Não foi possível concluir a operação.',
  );
}
