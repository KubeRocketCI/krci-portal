import type { FleetUnreachableReason } from "@my-project/shared";

/** The connection states every Factory read shares (`fleetSchema`, `agentReadSchema`). */
export type FactoryRead =
  | { state: "notConfigured" }
  | { state: "unreachable"; reason: FleetUnreachableReason }
  | { state: "ready"; updatedAt: string };

/** Cap on kept-read time; past it the unreachable state replaces the read. Measured on the browser clock. */
export const KEEP_LAST_READY_MS = 5 * 60_000;

/**
 * `refreshFailure`: the latest refresh found Agent Substrate unreachable; the read is the last ready one.
 * `refreshFailingSince`: epoch ms of the first of those failed refreshes, browser clock.
 */
export type KeptReadyRead<T extends FactoryRead> = Extract<T, { state: "ready" }> &
  Extract<FactoryRead, { state: "ready" }> & { refreshFailure?: FleetUnreachableReason; refreshFailingSince?: number };

export type KeptRead<T extends FactoryRead> = Exclude<T, { state: "ready" }> | KeptReadyRead<T>;

/** An unreachable read after a ready one keeps the ready one for KEEP_LAST_READY_MS. */
export function keepLastReady<T extends FactoryRead>(previous: KeptRead<T> | undefined, next: T): KeptRead<T> {
  if (next.state !== "unreachable" || previous?.state !== "ready") return next as KeptRead<T>;
  const kept = previous as KeptReadyRead<T>;
  const now = Date.now();
  const since = kept.refreshFailingSince ?? now;
  if (now - since > KEEP_LAST_READY_MS) return next as KeptRead<T>;
  const { reason } = next as Extract<FactoryRead, { state: "unreachable" }>;
  return { ...kept, refreshFailure: reason, refreshFailingSince: since };
}
