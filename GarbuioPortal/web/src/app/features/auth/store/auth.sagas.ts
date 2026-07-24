import { SagaGenerator, all, call, put, takeLeading } from 'typed-redux-saga';

import { normalizeApiError } from '../../../core/errors/api-error';
import { NotificationPort } from '../../../core/notifications/notification-port';
import { AuthApiService } from '../services/auth-api.service';
import {
  contextFailed,
  contextRequested,
  contextSucceeded,
  loginFailed,
  loginRequested,
  loginSucceeded,
  logoutFailed,
  logoutRequested,
  logoutSucceeded,
  restoreFailed,
  restoreRequested,
  restoreSucceeded,
} from './auth.actions';
import { AuthActionTypes as Types } from './auth.types';

export interface AuthSagaDependencies {
  readonly authApi: AuthApiService;
  readonly notifications: NotificationPort;
}

export function* authSagas(dependencies: AuthSagaDependencies): SagaGenerator<void> {
  yield* all([
    takeLeading(Types.RESTORE_REQUESTED, restoreWorker, dependencies),
    takeLeading(Types.LOGIN_REQUESTED, loginWorker, dependencies),
    takeLeading(Types.CONTEXT_REQUESTED, contextWorker, dependencies),
    takeLeading(Types.LOGOUT_REQUESTED, logoutWorker, dependencies),
  ]);
}

function* restoreWorker(
  dependencies: AuthSagaDependencies,
  _action: ReturnType<typeof restoreRequested>,
): SagaGenerator<void> {
  try {
    const bootstrap = yield* call([dependencies.authApi, dependencies.authApi.restore]);
    yield* put(restoreSucceeded(bootstrap));
  } catch (error: unknown) {
    yield* put(restoreFailed(normalizeApiError(error)));
  }
}

function* loginWorker(
  dependencies: AuthSagaDependencies,
  action: ReturnType<typeof loginRequested>,
): SagaGenerator<void> {
  try {
    const bootstrap = yield* call(
      [dependencies.authApi, dependencies.authApi.login],
      action.payload,
    );
    yield* put(loginSucceeded(bootstrap));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(loginFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* contextWorker(
  dependencies: AuthSagaDependencies,
  action: ReturnType<typeof contextRequested>,
): SagaGenerator<void> {
  try {
    const bootstrap = yield* call(
      [dependencies.authApi, dependencies.authApi.selectContext],
      action.payload,
    );
    yield* put(contextSucceeded(bootstrap));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(contextFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* logoutWorker(
  dependencies: AuthSagaDependencies,
  _action: ReturnType<typeof logoutRequested>,
): SagaGenerator<void> {
  try {
    yield* call([dependencies.authApi, dependencies.authApi.logout]);
    yield* put(logoutSucceeded());
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(logoutFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.warning], apiError.message);
  }
}
