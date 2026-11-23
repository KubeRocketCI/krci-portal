import type { ActorSnapshot } from "@my-project/shared";

export function latestSnapshot(snapshots: ActorSnapshot[]): ActorSnapshot | null {
  return snapshots.reduce<ActorSnapshot | null>(
    (latest, snapshot) => (latest === null || snapshot.generation > latest.generation ? snapshot : latest),
    null
  );
}
