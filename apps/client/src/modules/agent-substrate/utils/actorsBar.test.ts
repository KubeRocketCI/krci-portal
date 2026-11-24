import { describe, expect, it } from "vitest";
import { showsActorsBar } from "./actorsBar";

const SIZE = { cpuMillicores: 1000, memoryBytes: 2 * 1024 ** 3 };

describe("showsActorsBar", () => {
  it("shows a bar when room counts actors only", () => {
    expect(showsActorsBar({ roomSize: null, limitedBy: [] })).toBe(true);
    expect(showsActorsBar({ roomSize: null, limitedBy: ["actors"] })).toBe(true);
  });

  it("shows a bar when the actor count limits room", () => {
    expect(showsActorsBar({ roomSize: SIZE, limitedBy: ["actors"] })).toBe(true);
    expect(showsActorsBar({ roomSize: SIZE, limitedBy: ["actors", "memory"] })).toBe(true);
  });

  it("shows a bar for a row from a server that reports no room size", () => {
    expect(showsActorsBar({ limitedBy: ["cpu"] })).toBe(true);
    expect(showsActorsBar({})).toBe(true);
  });

  it("shows no bar for a row with a room size from a server that reports no limitedBy", () => {
    expect(showsActorsBar({ roomSize: SIZE })).toBe(false);
  });

  it("shows the actor count as text when CPU or memory limits room at a room size", () => {
    expect(showsActorsBar({ roomSize: SIZE, limitedBy: ["cpu", "memory"] })).toBe(false);
    expect(showsActorsBar({ roomSize: SIZE, limitedBy: [] })).toBe(false);
  });

  it("shows no bar when no actor template selects the worker pool", () => {
    expect(showsActorsBar({ roomState: "noTemplate", roomSize: null, limitedBy: [] })).toBe(false);
  });
});
