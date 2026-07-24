import { AuthState } from '../../features/auth/store/auth.state';
import { OrderServiceState } from '../../features/order-service/store/order-service.state';

export interface AppState {
  readonly auth: AuthState;
  readonly orderService: OrderServiceState;
}
