import { Injectable } from '@angular/core';
import { PoNotificationService } from '@po-ui/ng-components';

import { NotificationPort } from './notification-port';

@Injectable({ providedIn: 'root' })
export class PoNotificationAdapterService implements NotificationPort {
  constructor(private readonly notification: PoNotificationService) {}

  success(message: string): void {
    this.notification.success(message);
  }

  warning(message: string): void {
    this.notification.warning(message);
  }

  error(message: string): void {
    this.notification.error(message);
  }
}
