import { describe, expect, it } from "vitest";
import { fleetSnapshotSchema } from "./schemas.js";

describe("fleetSnapshotSchema", () => {
  it("drops an error message from an unreachable snapshot", () => {
    const result = fleetSnapshotSchema.parse({
      state: "unreachable",
      reason: "unavailable",
      message: "connect ECONNREFUSED 10.96.0.15:443",
    });

    expect(result).toEqual({ state: "unreachable", reason: "unavailable" });
    expect(result).not.toHaveProperty("message");
  });

  it("rejects an unreachable snapshot without a reason", () => {
    expect(fleetSnapshotSchema.safeParse({ state: "unreachable" }).success).toBe(false);
  });
});
