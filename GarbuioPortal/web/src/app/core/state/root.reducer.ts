import { Reducer } from 'redux';

import { authReducer } from '../../features/auth/store/auth.reducer';
import { AuthAction } from '../../features/auth/store/auth.actions';
import { OrderServiceAction } from '../../features/order-service/store/order-service.actions';
import { orderServiceReducer } from '../../features/order-service/store/order-service.reducer';
import { AppAction } from './app-action';
import { AppState } from './app-state';

export const rootReducer: Reducer<AppState, AppAction> = (state, action): AppState => ({
  auth: authReducer(state?.auth, action as AuthAction),
  orderService: orderServiceReducer(state?.orderService, action as OrderServiceAction),
});
