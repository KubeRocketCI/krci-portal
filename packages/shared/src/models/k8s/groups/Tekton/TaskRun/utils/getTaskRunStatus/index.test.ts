import { describe, expect, it } from "vitest";
import { getTaskRunStatus } from "./index.js";

describe("getTaskRunStatus", () => {
  it("should return status and reason from first condition", () => {
    const taskRun = {
      status: {
        conditions: [{ status: "True", reason: "Succeeded" }],
      },
    } as any;
    expect(getTaskRunStatus(taskRun)).toEqual({
      status: "true",
      reason: "succeeded",
    });
  });

  it("should lowercase status and reason", () => {
    const taskRun = {
      status: {
        conditions: [{ status: "FALSE", reason: "Failed" }],
      },
    } as any;
    expect(getTaskRunStatus(taskRun)).toEqual({
      status: "false",
      reason: "failed",
    });
  });

  it("should return unknown when conditions are missing", () => {
    expect(getTaskRunStatus({} as any)).toEqual({ status: "unknown", reason: "unknown" });
    expect(getTaskRunStatus({ status: {} } as any)).toEqual({ status: "unknown", reason: "unknown" });
    expect(getTaskRunStatus({ status: { conditions: [] } } as any)).toEqual({
      status: "unknown",
      reason: "unknown",
    });
  });

  it("should return unknown when taskRun is undefined", () => {
    expect(getTaskRunStatus(undefined)).toEqual({ status: "unknown", reason: "unknown" });
  });
});
