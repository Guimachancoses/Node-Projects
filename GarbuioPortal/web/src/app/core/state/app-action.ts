import { AuthAction } from '../../features/auth/store/auth.actions';
import { OrderServiceAction } from '../../features/order-service/store/order-service.actions';

export type AppAction = AuthAction | OrderServiceAction;
