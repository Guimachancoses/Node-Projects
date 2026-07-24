import { SagaGenerator, all, call } from 'typed-redux-saga';

import { AuthSagaDependencies, authSagas } from '../../features/auth/store/auth.sagas';
import {
  OrderServiceSagaDependencies,
  orderServiceSagas,
} from '../../features/order-service/store/order-service.sagas';

export type RootSagaDependencies = AuthSagaDependencies & OrderServiceSagaDependencies;

export function* rootSaga(dependencies: RootSagaDependencies): SagaGenerator<void> {
  yield* all([call(authSagas, dependencies), call(orderServiceSagas, dependencies)]);
}
