import type { RoomResource, RoomState } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { EMPTY_FLEET, FULL_WORKER_POOL_FLEET, HEALTHY_FLEET, RUNNING_ACTOR } from "../__fixtures__/storyFleet";
import {
  fleetRoom,
  labelsText,
  limitedByText,
  placementWorkerPool,
  roomSizeText,
  roomVerdict,
  sizeText,
  workerPoolsText,
  workerSelectorText,
  type WorkerPoolRoom,
} from "./roomLabel";

const GIB = 1024 ** 3;
const SIZE = { cpuMillicores: 1000, memoryBytes: 2 * GIB };

describe("sizeText", () => {
  it("names a size in CPU and memory", () => {
    expect(sizeText(SIZE)).toBe("1.0 CPU, 2.0 Gi");
  });

  it("gives memory alone in Mi and a CPU of 0 as 0", () => {
    expect(sizeText({ cpuMillicores: 0, memoryBytes: 512 * 1024 ** 2 })).toBe("0 CPU, 512 Mi");
  });

  it("gives no text with no size", () => {
    expect(sizeText(null)).toBeNull();
  });
});

describe("roomSizeText", () => {
  it("gives the room size of the worker pool", () => {
    expect(roomSizeText({ roomState: "room", roomSize: SIZE })).toBe("1.0 CPU, 2.0 Gi");
    expect(roomSizeText({ roomState: "full", roomSize: { cpuMillicores: 500, memoryBytes: 512 * 1024 ** 2 } })).toBe(
      "0.50 CPU, 512 Mi"
    );
  });

  it("counts by actor count when the worker pool has room, or none, with no room size", () => {
    expect(roomSizeText({ roomState: "room", roomSize: null })).toBe("By actor count");
    expect(roomSizeText({ roomState: "tooSmall", roomSize: null })).toBe("By actor count");
  });

  it("gives no text for a worker pool with no worker or that no actor template selects", () => {
    expect(roomSizeText({ roomState: "noWorker", roomSize: null })).toBeNull();
    expect(roomSizeText({ roomState: "noTemplate", roomSize: null })).toBeNull();
  });

  it("gives no text for a row from a server that reports no room size per worker pool", () => {
    expect(roomSizeText({ roomState: "room" })).toBeNull();
    expect(roomSizeText({})).toBeNull();
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
  it("gives the room in actors as success", () => {
    expect(roomVerdict({ roomState: "room", room: 3 }, 3)).toEqual({ tone: "success", text: "Room for 3 actors" });
    expect(roomVerdict({ roomState: "room", room: 1 }, 4)).toEqual({ tone: "success", text: "Room for 1 actor" });
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

  it("gives a worker pool that no actor template selects as muted, with no suffix, whatever the fleet room", () => {
    const noTemplate: WorkerPoolRoom = { roomState: "noTemplate", room: 0, limitedBy: [], roomSize: null };

    expect(roomVerdict(noTemplate, 2)).toEqual({ tone: "muted", text: "No actor template selects this worker pool" });
    expect(roomVerdict(noTemplate, 0)).toEqual({ tone: "muted", text: "No actor template selects this worker pool" });
  });

  it("gives a too small worker pool with no room size as no actor capacity", () => {
    const noCapacity: WorkerPoolRoom = { roomState: "tooSmall", room: 0, limitedBy: ["actors"], roomSize: null };

    expect(roomVerdict(noCapacity, 2)).toEqual({ tone: "warning", text: "No actor capacity" });
    expect(roomVerdict(noCapacity, 0)).toEqual({ tone: "error", text: "No actor capacity: no room in the fleet" });
  });

  it("gives a too small worker pool limited by the actor count alone as no actor capacity, with a room size", () => {
    const noCapacity: WorkerPoolRoom = { roomState: "tooSmall", room: 0, limitedBy: ["actors"], roomSize: SIZE };

    expect(roomVerdict(noCapacity, 2)).toEqual({ tone: "warning", text: "No actor capacity" });
    expect(roomVerdict(noCapacity, 0)).toEqual({ tone: "error", text: "No actor capacity: no room in the fleet" });
  });

  it("gives a too small worker pool with a room size, limited by CPU or memory, as too small for the room size", () => {
    expect(roomVerdict({ roomState: "tooSmall", room: 0, limitedBy: ["memory"], roomSize: SIZE }, 2)).toEqual({
      tone: "warning",
      text: "Too small for the room size",
    });
    expect(roomVerdict({ roomState: "tooSmall", room: 0, limitedBy: ["actors", "cpu"], roomSize: SIZE }, 2)).toEqual({
      tone: "warning",
      text: "Too small for the room size",
    });
  });

  describe("a row from a server that reports no roomState", () => {
    it("gives room from room above zero", () => {
      expect(roomVerdict({ room: 2, limitedBy: ["cpu"] }, 2)).toEqual({ tone: "success", text: "Room for 2 actors" });
      expect(roomVerdict({ room: 2 }, 2)).toEqual({ tone: "success", text: "Room for 2 actors" });
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
      expect(roomVerdict({ room: 1, roomState: unknown }, 1)).toEqual({ tone: "success", text: "Room for 1 actor" });
    });
  });
});

describe("limitedByText", () => {
  it("names the resource that limits room", () => {
    expect(limitedByText(["memory"])).toBe("Memory");
    expect(limitedByText(["cpu"])).toBe("CPU");
    expect(limitedByText(["actors"])).toBe("Actor count");
  });

  it("joins resources that limit room alike", () => {
    expect(limitedByText(["cpu", "memory"])).toBe("CPU and memory");
    expect(limitedByText(["actors", "cpu", "memory"])).toBe("Actor count, CPU and memory");
  });

  it("names a resource the client does not know as the server sends it", () => {
    expect(limitedByText(["cpu", "gpu" as unknown as RoomResource])).toBe("CPU and gpu");
  });

  it("gives no text when no resource limits room or the server reports no limitedBy", () => {
    expect(limitedByText([])).toBeNull();
    expect(limitedByText(undefined)).toBeNull();
  });
});

describe("labelsText", () => {
  it("gives labels as key=value, sorted by key", () => {
    expect(labelsText({ zone: "a", workload: "workers" })).toBe("workload=workers, zone=a");
    expect(labelsText({ workload: "workers" })).toBe("workload=workers");
  });

  it("gives no text with no labels or for a row from a server that reports none", () => {
    expect(labelsText({})).toBeNull();
    expect(labelsText(undefined)).toBeNull();
  });
});

describe("workerPoolsText", () => {
  it("names worker pools by namespace and name, comma separated", () => {
    expect(
      workerPoolsText([
        { namespace: "krci-agents", name: "workers" },
        { namespace: "krci-agents", name: "workers-small" },
      ])
    ).toBe("krci-agents/workers, krci-agents/workers-small");
  });

  it("gives no text with no worker pool", () => {
    expect(workerPoolsText([])).toBeNull();
  });

  it("gives no text for an actor from a server that reports no usable worker pools", () => {
    expect(workerPoolsText(undefined)).toBeNull();
  });
});

describe("placementWorkerPool", () => {
  it("names the worker pool of a placement by namespace and name", () => {
    expect(placementWorkerPool(RUNNING_ACTOR.placement)).toBe("krci-agents/workers");
  });

  it("gives no worker pool for a null placement", () => {
    expect(placementWorkerPool(null)).toBeUndefined();
  });
});

describe("workerSelectorText", () => {
  it("gives the match labels as key=value, sorted by key", () => {
    expect(workerSelectorText({ workload: "workers", tier: "gpu" })).toBe("tier=gpu, workload=workers");
  });

  it("names a worker selector with no keys as any worker", () => {
    expect(workerSelectorText({})).toBe("Any worker");
  });

  it("gives no text when the actor template is gone", () => {
    expect(workerSelectorText(null)).toBeNull();
  });

  it("gives no text for an actor from a server that reports no worker selector", () => {
    expect(workerSelectorText(undefined)).toBeNull();
  });
});
