import { describe, expect, it } from "vitest";
import { sortKubeObjectByCreationTimestamp } from "./sortKubeObjectByCreationTimestamp.js";

const makeObj = (timestamp: string | undefined) =>
  ({
    metadata: {
      creationTimestamp: timestamp,
      name: "test",
      uid: "uid",
    },
  }) as any;

describe("sortKubeObjectByCreationTimestamp", () => {
  it("should sort newer items first by default (forward)", () => {
    const older = makeObj("2023-01-01T00:00:00Z");
    const newer = makeObj("2024-01-01T00:00:00Z");

    expect(sortKubeObjectByCreationTimestamp(newer, older)).toBe(-1);
    expect(sortKubeObjectByCreationTimestamp(older, newer)).toBe(1);
  });

  it("should sort older items first when backwards is true", () => {
    const older = makeObj("2023-01-01T00:00:00Z");
    const newer = makeObj("2024-01-01T00:00:00Z");

    expect(sortKubeObjectByCreationTimestamp(newer, older, true)).toBe(1);
    expect(sortKubeObjectByCreationTimestamp(older, newer, true)).toBe(-1);
  });

  it("should handle equal timestamps", () => {
    const a = makeObj("2023-01-01T00:00:00Z");
    const b = makeObj("2023-01-01T00:00:00Z");

    // Equal timestamps: a > b is false, returns 1 (forward)
    expect(sortKubeObjectByCreationTimestamp(a, b)).toBe(1);
  });

  it("should handle both timestamps missing", () => {
    const a = makeObj(undefined);
    const b = makeObj(undefined);

    // Both fallback to 0, 0 > 0 is false, returns 1 (forward)
    expect(sortKubeObjectByCreationTimestamp(a, b)).toBe(1);
    // With backwards: returns -1
    expect(sortKubeObjectByCreationTimestamp(a, b, true)).toBe(-1);
  });
});
