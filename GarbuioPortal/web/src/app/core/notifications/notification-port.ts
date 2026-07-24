export abstract class NotificationPort {
  abstract success(message: string): void;
  abstract warning(message: string): void;
  abstract error(message: string): void;
}
