import { describe, expect, it } from "vitest";
import { fleetSchema } from "./schemas.js";

describe("fleetSchema", () => {
  it("drops an error message from an unreachable fleet", () => {
    const result = fleetSchema.parse({
      state: "unreachable",
      reason: "unavailable",
      message: "connect ECONNREFUSED 10.96.0.15:443",
    });

    expect(result).toEqual({ state: "unreachable", reason: "unavailable" });
    expect(result).not.toHaveProperty("message");
  });

  it("rejects an unreachable fleet without a reason", () => {
    expect(fleetSchema.safeParse({ state: "unreachable" }).success).toBe(false);
  });
});
