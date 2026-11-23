import { describe, expect, it } from "vitest";
import { latestSnapshot } from "./latestSnapshot.js";
import type { ActorSnapshot } from "./types.js";

const snapshot = (generation: number): ActorSnapshot => ({
  uuid: `snap-${generation}`,
  generation,
  fidelity: "memory",
  locality: null,
  durableState: "completed",
});

describe("latestSnapshot", () => {
  it("gives the snapshot of the highest generation, in any order", () => {
    expect(latestSnapshot([snapshot(2), snapshot(3), snapshot(1)])).toEqual(snapshot(3));
  });

  it("gives null for no snapshot", () => {
    expect(latestSnapshot([])).toBeNull();
  });
});
