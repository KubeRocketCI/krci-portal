import { describe, expect, it } from "vitest";
import { replicasText, roomBasisText, roomVerdict } from "./capacity";

const GIB = 1024 ** 3;
const SIZE = { cpuMillicores: 1000, memoryBytes: 2 * GIB };

describe("roomVerdict", () => {
  it("gives the room in agents as success", () => {
    expect(roomVerdict(3, ["cpu"])).toEqual({ hasRoom: true, text: "Room for 3 agents" });
    expect(roomVerdict(1, ["memory"])).toEqual({ hasRoom: true, text: "Room for 1 agent" });
  });

  it("gives full as error at room zero", () => {
    expect(roomVerdict(0, ["memory"])).toEqual({ hasRoom: false, text: "Full: the next agent waits" });
  });

  it("gives no worker as error at room zero when no worker is active and registered", () => {
    expect(roomVerdict(0, [])).toEqual({ hasRoom: false, text: "No worker: the next agent waits" });
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

  it("says that no worker hosts actors when no resource limits room", () => {
    expect(roomBasisText(SIZE, [])).toBe("at 1.0 CPU, 2.0 Gi · no active, registered worker");
    expect(roomBasisText(null, [])).toBe("no actor template limits · no active, registered worker");
  });
});

describe("replicasText", () => {
  const resource = { desiredReplicas: 2, readyReplicas: 1, sandboxClass: "gvisor", resolution: "Resolved" };

  it("gives desired and ready replicas of the WorkerPool", () => {
    expect(replicasText(resource, "ok")).toBe("2 desired, 1 ready");
    expect(replicasText(resource, "denied")).toBe("2 desired, 1 ready");
  });

  it("says why there are no replicas", () => {
    expect(replicasText(null, "denied")).toBe("no access");
    expect(replicasText(null, "error")).toBe("not readable");
    expect(replicasText(null, "ok")).toBe("no WorkerPool resource");
  });
});
