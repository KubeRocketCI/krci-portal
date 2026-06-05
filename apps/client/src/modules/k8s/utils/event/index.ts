import type { Event as K8sEvent } from "@my-project/shared";

/**
 * Best available timestamp string for ordering/displaying a core/v1 Event:
 * `lastTimestamp` (legacy), then `eventTime` (newer API servers), then the
 * object's `creationTimestamp`. `undefined` when the event carries none.
 */
export function getEventTimestamp(event: K8sEvent): string | undefined {
  return event.lastTimestamp ?? event.eventTime ?? event.metadata?.creationTimestamp;
}

/**
 * Numeric epoch (ms) for sorting events newest-first. Returns 0 when the event
 * has no timestamp or the value is unparseable, so a malformed event sorts last
 * instead of poisoning the comparator with `NaN`.
 */
export function getEventTime(event: K8sEvent): number {
  const raw = getEventTimestamp(event);
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * Newest-first copy of `events`, capped at `limit`. Copies before sorting because
 * callers pass memoized arrays and `Array.prototype.sort` mutates in place;
 * orders by `getEventTime` (lastTimestamp→eventTime→creationTimestamp, NaN-safe).
 */
export function sortLatestEvents<T extends K8sEvent>(events: T[], limit: number): T[] {
  return [...events].sort((a, b) => getEventTime(b) - getEventTime(a)).slice(0, limit);
}
