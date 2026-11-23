import { describe, expect, it } from "vitest";
import { roomLabel } from "./roomLabel";

describe("roomLabel", () => {
  it("names the room size in CPU and memory", () => {
    expect(roomLabel(3, { cpuMillicores: 1000, memoryBytes: 2 * 1024 ** 3 })).toBe("room 3 (at 1.0 CPU, 2.0 Gi)");
  });

  it("gives memory alone in Mi and a CPU of 0 as 0", () => {
    expect(roomLabel(0, { cpuMillicores: 0, memoryBytes: 512 * 1024 ** 2 })).toBe("room 0 (at 0 CPU, 512 Mi)");
  });

  it("counts by actor count when there is no room size", () => {
    expect(roomLabel(7, null)).toBe("room 7 (by actor count)");
  });
});
