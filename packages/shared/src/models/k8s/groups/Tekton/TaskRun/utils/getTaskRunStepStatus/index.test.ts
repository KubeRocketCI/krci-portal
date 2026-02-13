import { describe, expect, it } from "vitest";
import { getTaskRunStepStatus } from "./index.js";

describe("getTaskRunStepStatus", () => {
  it("should return running status when step has running state", () => {
    const step = {
      running: { startedAt: "2025-01-01T00:00:00Z" },
    } as any;
    expect(getTaskRunStepStatus(step)).toEqual({
      statusObject: undefined,
      status: "running",
      reason: "Unknown",
      startedAt: "2025-01-01T00:00:00Z",
      finishedAt: "",
    });
  });

  it("should return terminated status when step has terminated state", () => {
    const step = {
      terminated: {
        reason: "Completed",
        startedAt: "2025-01-01T00:00:00Z",
        finishedAt: "2025-01-01T00:01:00Z",
      },
    } as any;
    expect(getTaskRunStepStatus(step)).toEqual({
      statusObject: step.terminated,
      status: "terminated",
      reason: "Completed",
      startedAt: "2025-01-01T00:00:00Z",
      finishedAt: "2025-01-01T00:01:00Z",
    });
  });

  it("should return waiting status when step has waiting state", () => {
    const step = {
      waiting: { reason: "Completed" },
    } as any;
    expect(getTaskRunStepStatus(step)).toEqual({
      statusObject: step.waiting,
      status: "waiting",
      reason: "Completed",
      startedAt: "",
      finishedAt: "",
    });
  });

  it("should return Unknown when step is undefined", () => {
    expect(getTaskRunStepStatus(undefined)).toEqual({
      statusObject: undefined,
      status: "Unknown",
      reason: "Unknown",
      startedAt: "",
      finishedAt: "",
    });
  });

  it("should return Unknown when step has no state", () => {
    expect(getTaskRunStepStatus({} as any)).toEqual({
      statusObject: undefined,
      status: "Unknown",
      reason: "Unknown",
      startedAt: "",
      finishedAt: "",
    });
  });
});
