import { AuthRequestState } from '../models/auth.models';
import { AuthAction } from './auth.actions';
import { AuthState, authIdleRequest, initialAuthState } from './auth.state';
import { AuthActionTypes as Types } from './auth.types';

const loading = (): AuthRequestState => ({ status: 'loading', error: null });
const success = (): AuthRequestState => ({ status: 'success', error: null });

export function authReducer(state: AuthState = initialAuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case Types.RESTORE_REQUESTED:
      return { ...state, restoreRequest: loading() };
    case Types.RESTORE_SUCCEEDED:
      return {
        ...state,
        ...action.payload,
        restoreRequest: success(),
      };
    case Types.RESTORE_FAILED:
      return {
        ...initialAuthState,
        restoreRequest: { status: 'error', error: action.payload },
      };
    case Types.LOGIN_REQUESTED:
      return { ...state, loginRequest: loading() };
    case Types.LOGIN_SUCCEEDED:
      return {
        ...state,
        ...action.payload,
        loginRequest: success(),
        restoreRequest: success(),
      };
    case Types.LOGIN_FAILED:
      return {
        ...state,
        session: null,
        loginRequest: { status: 'error', error: action.payload },
      };
    case Types.CONTEXT_REQUESTED:
      return { ...state, contextRequest: loading() };
    case Types.CONTEXT_SUCCEEDED:
      return {
        ...state,
        ...action.payload,
        contextRequest: success(),
      };
    case Types.CONTEXT_FAILED:
      return {
        ...state,
        contextRequest: { status: 'error', error: action.payload },
      };
    case Types.LOGOUT_REQUESTED:
      return {
        ...initialAuthState,
        restoreRequest: success(),
        logoutRequest: loading(),
      };
    case Types.LOGOUT_SUCCEEDED:
      return {
        ...initialAuthState,
        restoreRequest: success(),
        logoutRequest: success(),
      };
    case Types.LOGOUT_FAILED:
      return {
        ...initialAuthState,
        restoreRequest: success(),
        logoutRequest: { status: 'error', error: action.payload },
      };
    case Types.SESSION_CLEARED:
      return { ...initialAuthState, restoreRequest: authIdleRequest };
    default:
      return state;
  }
}
