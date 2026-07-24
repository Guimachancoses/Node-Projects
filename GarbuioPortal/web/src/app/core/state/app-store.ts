import { InjectionToken } from '@angular/core';
import { applyMiddleware, legacy_createStore, Store } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { OrderServiceApiService } from '../../features/order-service/services/order-service-api.service';
import { NotificationPort } from '../notifications/notification-port';
import { AppAction } from './app-action';
import { AppState } from './app-state';
import { rootReducer } from './root.reducer';
import { rootSaga } from './root.saga';

export type AppStore = Store<AppState, AppAction>;

export const APP_STORE = new InjectionToken<AppStore>('APP_STORE');

export function createAppStore(
  api: OrderServiceApiService,
  authApi: AuthApiService,
  notifications: NotificationPort,
): AppStore {
  const sagaMiddleware = createSagaMiddleware();
  const store = legacy_createStore(rootReducer, undefined, applyMiddleware(sagaMiddleware));

  sagaMiddleware.run(rootSaga, { api, authApi, notifications });

  return store;
}
