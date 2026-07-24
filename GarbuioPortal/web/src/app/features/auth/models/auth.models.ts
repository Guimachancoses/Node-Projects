import { ApiError } from '../../../core/errors/api-error';

export interface AuthSelectOption {
  readonly label: string;
  readonly value: string;
}

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

export interface AuthBootstrap {
  readonly session: AuthSession;
  readonly branches: ReadonlyArray<AuthSelectOption>;
  readonly defaultBaseDate: string;
}

export interface LoginCredentials {
  readonly userName: string;
  readonly password: string;
}

export interface SelectContextRequest {
  readonly baseDate: string;
  readonly branch: string;
}

export type AuthRequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthRequestState {
  readonly status: AuthRequestStatus;
  readonly error: ApiError | null;
}
