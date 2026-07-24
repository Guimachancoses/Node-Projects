import { AppState } from '../../../core/state/app-state';

export const selectAuthState = (state: AppState) => state.auth;
export const selectAuthSession = (state: AppState) => state.auth.session;
export const selectAuthBranches = (state: AppState) => state.auth.branches;
export const selectDefaultBaseDate = (state: AppState) => state.auth.defaultBaseDate;
export const selectRestoreRequest = (state: AppState) => state.auth.restoreRequest;
export const selectLoginRequest = (state: AppState) => state.auth.loginRequest;
export const selectContextRequest = (state: AppState) => state.auth.contextRequest;
export const selectIsAuthenticated = (state: AppState) => state.auth.session !== null;
export const selectHasContext = (state: AppState) => state.auth.session?.context != null;
