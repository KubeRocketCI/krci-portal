import type { RoomResource, RoomState } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { EMPTY_FLEET, FULL_WORKER_POOL_FLEET, HEALTHY_FLEET } from "../__fixtures__/storyFleet";
import { fleetRoom, roomBasisText, roomSizeLabel, roomVerdict } from "./roomLabel";

const GIB = 1024 ** 3;
const SIZE = { cpuMillicores: 1000, memoryBytes: 2 * GIB };

describe("roomSizeLabel", () => {
  it("names the room size in CPU and memory", () => {
    expect(roomSizeLabel(SIZE)).toBe("at 1.0 CPU, 2.0 Gi");
  });

  it("gives memory alone in Mi and a CPU of 0 as 0", () => {
    expect(roomSizeLabel({ cpuMillicores: 0, memoryBytes: 512 * 1024 ** 2 })).toBe("at 0 CPU, 512 Mi");
  });

  it("counts by actor count when there is no room size", () => {
    expect(roomSizeLabel(null)).toBe("by actor count");
  });
});

describe("fleetRoom", () => {
  it("sums room over the worker pools", () => {
    expect(fleetRoom(HEALTHY_FLEET.workerPools)).toBe(4 + 7);
    expect(fleetRoom(FULL_WORKER_POOL_FLEET.workerPools)).toBe(0);
    expect(fleetRoom(EMPTY_FLEET.workerPools)).toBe(0);
  });
});

describe("roomVerdict", () => {
  it("gives the room in agents as success", () => {
    expect(roomVerdict({ roomState: "room", room: 3 }, 3)).toEqual({ tone: "success", text: "Room for 3 agents" });
    expect(roomVerdict({ roomState: "room", room: 1 }, 4)).toEqual({ tone: "success", text: "Room for 1 agent" });
  });

  it("gives a worker pool with no room as a warning while another worker pool has room", () => {
    expect(roomVerdict({ roomState: "full", room: 0 }, 2)).toEqual({ tone: "warning", text: "Full" });
    expect(roomVerdict({ roomState: "tooSmall", room: 0 }, 2)).toEqual({
      tone: "warning",
      text: "Too small for the room size",
    });
    expect(roomVerdict({ roomState: "noWorker", room: 0 }, 2)).toEqual({
      tone: "warning",
      text: "No active, registered worker",
    });
  });

  it("gives a worker pool with no room as an error when the fleet has no room", () => {
    expect(roomVerdict({ roomState: "full", room: 0 }, 0)).toEqual({
      tone: "error",
      text: "Full: no room in the fleet",
    });
    expect(roomVerdict({ roomState: "tooSmall", room: 0 }, 0)).toEqual({
      tone: "error",
      text: "Too small for the room size: no room in the fleet",
    });
    expect(roomVerdict({ roomState: "noWorker", room: 0 }, 0)).toEqual({
      tone: "error",
      text: "No active, registered worker: no room in the fleet",
    });
  });

  describe("a row from a server that reports no roomState", () => {
    it("gives room from room above zero", () => {
      expect(roomVerdict({ room: 2, limitedBy: ["cpu"] }, 2)).toEqual({ tone: "success", text: "Room for 2 agents" });
      expect(roomVerdict({ room: 2 }, 2)).toEqual({ tone: "success", text: "Room for 2 agents" });
    });

    it("gives no active, registered worker from an empty limitedBy", () => {
      expect(roomVerdict({ room: 0, limitedBy: [] }, 2)).toEqual({
        tone: "warning",
        text: "No active, registered worker",
      });
    });

    it("gives a generic no room when limitedBy does not tell full from too small, or is missing", () => {
      expect(roomVerdict({ room: 0, limitedBy: ["memory"] }, 2)).toEqual({ tone: "warning", text: "No room" });
      expect(roomVerdict({ room: 0 }, 2)).toEqual({ tone: "warning", text: "No room" });
      expect(roomVerdict({ room: 0 }, 0)).toEqual({ tone: "error", text: "No room in the fleet" });
    });

    it("treats a roomState the client does not know as no roomState", () => {
      const unknown = "draining" as unknown as RoomState;

      expect(roomVerdict({ room: 0, roomState: unknown, limitedBy: ["cpu"] }, 2)).toEqual({
        tone: "warning",
        text: "No room",
      });
      expect(roomVerdict({ room: 1, roomState: unknown }, 1)).toEqual({ tone: "success", text: "Room for 1 agent" });
    });
  });
});

describe("roomBasisText", () => {
  it("names the room size and the resource that limits room", () => {
    expect(roomBasisText(SIZE, ["memory"])).toBe("at 1.0 CPU, 2.0 Gi · limited by memory");
    expect(roomBasisText(SIZE, ["cpu"])).toBe("at 1.0 CPU, 2.0 Gi · limited by CPU");
    expect(roomBasisText(SIZE, ["actors"])).toBe("at 1.0 CPU, 2.0 Gi · limited by actor count");
  });

  it("joins resources that limit room alike", () => {
    expect(roomBasisText(SIZE, ["cpu", "memory"])).toBe("at 1.0 CPU, 2.0 Gi · limited by CPU and memory");
    expect(roomBasisText(SIZE, ["actors", "cpu", "memory"])).toBe(
      "at 1.0 CPU, 2.0 Gi · limited by actor count, CPU and memory"
    );
  });

  it("says that no actor template sets limits when there is no room size", () => {
    expect(roomBasisText(null, ["actors"])).toBe("no actor template limits · limited by actor count");
  });

  it("gives the room size alone when no resource limits room", () => {
    expect(roomBasisText(SIZE, [])).toBe("at 1.0 CPU, 2.0 Gi");
    expect(roomBasisText(null, [])).toBe("no actor template limits");
  });

  it("names a resource the client does not know as the server sends it", () => {
    expect(roomBasisText(SIZE, ["cpu", "gpu" as unknown as RoomResource])).toBe(
      "at 1.0 CPU, 2.0 Gi · limited by CPU and gpu"
    );
  });

  it("gives the room size alone for a row from a server that reports no limitedBy", () => {
    expect(roomBasisText(SIZE, undefined)).toBe("at 1.0 CPU, 2.0 Gi");
  });
});
