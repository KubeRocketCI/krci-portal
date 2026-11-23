import type { ActorSnapshot } from "./types.js";

/** The snapshot of the highest generation. Null when the actor has none. */
export function latestSnapshot(snapshots: ActorSnapshot[]): ActorSnapshot | null {
  let latest: ActorSnapshot | null = null;
  for (const snapshot of snapshots) {
    if (latest === null || snapshot.generation > latest.generation) latest = snapshot;
  }
  return latest;
}
