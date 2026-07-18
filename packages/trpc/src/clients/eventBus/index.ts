import { EventEmitter } from "node:events";
import type { NotificationEvent } from "@my-project/shared";

const NOTIFICATION_CHANNEL = "notification";

/**
 * Process-wide singleton bridging the non-tRPC ingestion route
 * (`apps/server/src/config/internalEvents.ts`) and the `notifications.subscribe`
 * tRPC subscription without any cross-process transport — both sides must
 * import the same EventEmitter instance.
 *
 * Max listeners raised because every open subscription WebSocket registers one.
 */
class NotificationEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  publish(event: NotificationEvent): void {
    this.emit(NOTIFICATION_CHANNEL, event);
  }

  onNotification(listener: (event: NotificationEvent) => void): void {
    this.on(NOTIFICATION_CHANNEL, listener);
  }

  offNotification(listener: (event: NotificationEvent) => void): void {
    this.off(NOTIFICATION_CHANNEL, listener);
  }
}

export const notificationEventBus = new NotificationEventBus();
