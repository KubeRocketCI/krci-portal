import { z } from "zod";
import { notificationEventSchema, notificationSeveritySchema } from "./schemas.js";

export type NotificationSeverity = z.infer<typeof notificationSeveritySchema>;

export type NotificationEvent = z.infer<typeof notificationEventSchema>;

/** A stored notification joined with the requesting user's read-state. */
export interface NotificationListItem extends NotificationEvent {
  read: boolean;
}
