import { Provider } from '@angular/core';

import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { OrderServiceApiService } from '../../features/order-service/services/order-service-api.service';
import { NotificationPort } from '../notifications/notification-port';
import { PoNotificationAdapterService } from '../notifications/po-notification-adapter.service';
import { APP_STORE, createAppStore } from './app-store';

export function provideAppState(): ReadonlyArray<Provider> {
  return [
    {
      provide: NotificationPort,
      useExisting: PoNotificationAdapterService,
    },
    {
      provide: APP_STORE,
      useFactory: createAppStore,
      deps: [OrderServiceApiService, AuthApiService, NotificationPort],
    },
  ];
}
