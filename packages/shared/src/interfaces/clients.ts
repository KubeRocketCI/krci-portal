import type { NotificationEvent, NotificationListItem } from "../models/notifications/types.js";

/**
 * Session store interface matching @fastify/session SessionStore contract
 */
export interface ISessionStore {
  get(sessionId: string, callback: (err: Error | null, session: unknown) => void): void;
  set(sessionId: string, session: unknown, callback: (err?: Error | null) => void): void;
  destroy(sessionId: string, callback: (err?: Error | null) => void): void;
  cleanup?(): void;
}

/**
 * Implemented by the server's SQLite store and consumed by the tRPC router
 * via `TRPCContext`, so the router package never depends on the concrete
 * storage implementation.
 */
export interface INotificationsStore {
  /** Idempotent on `event.id` — re-inserting is a no-op. */
  insert(event: NotificationEvent): void;
  /** Newest-first with `userSub`'s read-state; `before` paginates by created-at (ms epoch, exclusive). */
  list(params: { userSub: string; limit?: number; before?: number }): NotificationListItem[];
  markRead(params: { userSub: string; ids: string[] }): void;
  markAllRead(params: { userSub: string }): void;
  /** Deletes notifications older than `olderThanDays` (default 7). */
  cleanup(olderThanDays?: number): void;
}
