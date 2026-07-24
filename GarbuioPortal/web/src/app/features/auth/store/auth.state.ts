import { AuthRequestState, AuthSelectOption, AuthSession } from '../models/auth.models';

export interface AuthState {
  readonly session: AuthSession | null;
  readonly branches: ReadonlyArray<AuthSelectOption>;
  readonly defaultBaseDate: string;
  readonly restoreRequest: AuthRequestState;
  readonly loginRequest: AuthRequestState;
  readonly contextRequest: AuthRequestState;
  readonly logoutRequest: AuthRequestState;
}

export const authIdleRequest: AuthRequestState = { status: 'idle', error: null };

export const initialAuthState: AuthState = {
  session: null,
  branches: [],
  defaultBaseDate: '',
  restoreRequest: authIdleRequest,
  loginRequest: authIdleRequest,
  contextRequest: authIdleRequest,
  logoutRequest: authIdleRequest,
};
