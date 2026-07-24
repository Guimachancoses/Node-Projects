import { ApiError } from '../../../core/errors/api-error';
import { AuthBootstrap, LoginCredentials, SelectContextRequest } from '../models/auth.models';
import { AuthActionTypes as Types } from './auth.types';

export const restoreRequested = () => ({ type: Types.RESTORE_REQUESTED }) as const;
export const restoreSucceeded = (payload: AuthBootstrap) =>
  ({ type: Types.RESTORE_SUCCEEDED, payload }) as const;
export const restoreFailed = (payload: ApiError) =>
  ({ type: Types.RESTORE_FAILED, payload }) as const;

export const loginRequested = (payload: LoginCredentials) =>
  ({ type: Types.LOGIN_REQUESTED, payload }) as const;
export const loginSucceeded = (payload: AuthBootstrap) =>
  ({ type: Types.LOGIN_SUCCEEDED, payload }) as const;
export const loginFailed = (payload: ApiError) => ({ type: Types.LOGIN_FAILED, payload }) as const;

export const contextRequested = (payload: SelectContextRequest) =>
  ({ type: Types.CONTEXT_REQUESTED, payload }) as const;
export const contextSucceeded = (payload: AuthBootstrap) =>
  ({ type: Types.CONTEXT_SUCCEEDED, payload }) as const;
export const contextFailed = (payload: ApiError) =>
  ({ type: Types.CONTEXT_FAILED, payload }) as const;

export const logoutRequested = () => ({ type: Types.LOGOUT_REQUESTED }) as const;
export const logoutSucceeded = () => ({ type: Types.LOGOUT_SUCCEEDED }) as const;
export const logoutFailed = (payload: ApiError) =>
  ({ type: Types.LOGOUT_FAILED, payload }) as const;
export const sessionCleared = () => ({ type: Types.SESSION_CLEARED }) as const;

export type AuthAction =
  | ReturnType<typeof restoreRequested>
  | ReturnType<typeof restoreSucceeded>
  | ReturnType<typeof restoreFailed>
  | ReturnType<typeof loginRequested>
  | ReturnType<typeof loginSucceeded>
  | ReturnType<typeof loginFailed>
  | ReturnType<typeof contextRequested>
  | ReturnType<typeof contextSucceeded>
  | ReturnType<typeof contextFailed>
  | ReturnType<typeof logoutRequested>
  | ReturnType<typeof logoutSucceeded>
  | ReturnType<typeof logoutFailed>
  | ReturnType<typeof sessionCleared>;
