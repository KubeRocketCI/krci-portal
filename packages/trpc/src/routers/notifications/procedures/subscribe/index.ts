import type { NotificationEvent } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { notificationEventBus } from "../../../../clients/eventBus/index.js";
import { createEventQueue, yieldEvents } from "../../../../utils/createEventQueue/index.js";

/**
 * Streams every ingested notification to all connected clients — the stream
 * is deliberately global; per-user scoping lives entirely in the read-state
 * that `notifications.list` joins, so no filtering happens here.
 */
export const notificationsSubscribeProcedure = protectedProcedure.subscription(async function* ({ signal }) {
  const queue = createEventQueue<NotificationEvent>();

  const listener = (event: NotificationEvent) => queue.emit(event);
  notificationEventBus.onNotification(listener);

  try {
    yield* yieldEvents(queue, signal);
  } finally {
    notificationEventBus.offNotification(listener);
  }
});
