import { describe, expect, it, test } from "vitest";
import { getTaskRunStatus } from "./index.js";
import { getTaskRunStatusLabel } from "../getTaskRunStatusLabel/index.js";
import { taskRunPhase, taskRunStatusReason } from "../../constants.js";
import { reasonSchema } from "../../schema.js";
import { tektonResultAnnotations } from "../../../../../../tektonResults/annotations.js";

const run = (status: string, reason?: string) => ({
  status: { conditions: [{ type: "Succeeded", status, reason }] },
});

// Every known reason, one unknown reason, and no reason.
const ALL_REASONS: readonly (string | undefined)[] = [...reasonSchema.options, "somethingnew", undefined];

// Independent copy. Do not import from constants.ts.
const CANCELLED_REASONS: readonly string[] = [
  taskRunStatusReason.taskruncancelled,
  taskRunStatusReason.customruncancelled,
];

const expectedPhase = (status: string, reason: string | undefined) => {
  if (status === "True") return taskRunPhase.succeeded;
  if (status === "False") {
    return reason !== undefined && CANCELLED_REASONS.includes(reason) ? taskRunPhase.cancelled : taskRunPhase.failed;
  }
  return taskRunPhase["in-progress"];
};

describe("getTaskRunStatus", () => {
  describe("status x reason matrix", () => {
    for (const status of ["True", "False", "Unknown"]) {
      for (const reason of ALL_REASONS) {
        const expected = expectedPhase(status, reason);
        test(`status='${status}' reason='${reason}' -> '${expected}'`, () => {
          expect(getTaskRunStatus(run(status, reason)).phase).toBe(expected);
        });
      }
    }
  });

  it("treats a live run with no Succeeded condition as in progress", () => {
    expect(getTaskRunStatus({}).phase).toBe(taskRunPhase["in-progress"]);
    expect(getTaskRunStatus({ status: {} }).phase).toBe(taskRunPhase["in-progress"]);
    expect(getTaskRunStatus({ status: { conditions: [] } }).phase).toBe(taskRunPhase["in-progress"]);
  });

  it("classifies an archived record with no usable condition as unknown, not in progress", () => {
    const archived = (status?: { conditions?: { type: string; status?: string; reason?: string }[] }) => ({
      metadata: { annotations: { [tektonResultAnnotations.historySource]: "true" } },
      status,
    });

    expect(getTaskRunStatus(archived(undefined)).phase).toBe(taskRunPhase.unknown);
    expect(getTaskRunStatus(archived({ conditions: [] })).phase).toBe(taskRunPhase.unknown);
    expect(
      getTaskRunStatus(archived({ conditions: [{ type: "Succeeded", status: "Unknown", reason: "Running" }] })).phase
    ).toBe(taskRunPhase.unknown);
    expect(
      getTaskRunStatus(archived({ conditions: [{ type: "Succeeded", status: "True", reason: "Succeeded" }] })).phase
    ).toBe(taskRunPhase.succeeded);
    expect(
      getTaskRunStatus(archived({ conditions: [{ type: "Succeeded", status: "False", reason: "TaskRunCancelled" }] }))
        .phase
    ).toBe(taskRunPhase.cancelled);
  });

  it("returns unknown for no input object", () => {
    expect(getTaskRunStatus(undefined)).toEqual({
      phase: taskRunPhase.unknown,
      reason: undefined,
      message: undefined,
      lastTransitionTime: undefined,
      startTime: undefined,
      completionTime: undefined,
    });
  });

  it("selects the Succeeded condition rather than the first one", () => {
    const result = getTaskRunStatus({
      status: {
        conditions: [
          { type: "Ready", status: "False", reason: "Failed" },
          { type: "Succeeded", status: "True", reason: "Succeeded" },
        ],
      },
    });

    expect(result.phase).toBe(taskRunPhase.succeeded);
    expect(result.reason).toBe("succeeded");
  });

  it("lowercases the reason and passes through message and times", () => {
    const result = getTaskRunStatus({
      status: {
        conditions: [
          {
            type: "Succeeded",
            status: "False",
            reason: "TaskRunTimeout",
            message: "timed out",
            lastTransitionTime: "t",
          },
        ],
        startTime: "start",
        completionTime: "end",
      },
    });

    expect(result).toEqual({
      phase: taskRunPhase.failed,
      reason: "taskruntimeout",
      message: "timed out",
      lastTransitionTime: "t",
      startTime: "start",
      completionTime: "end",
    });
  });

  it("leaves absent times undefined rather than a placeholder string", () => {
    const result = getTaskRunStatus(run("Unknown", "Running"));

    expect(result.startTime).toBeUndefined();
    expect(result.completionTime).toBeUndefined();
    expect(result.message).toBeUndefined();
  });

  it("classifies a cancelled run as cancelled only on status False", () => {
    expect(getTaskRunStatus(run("False", "TaskRunCancelled")).phase).toBe(taskRunPhase.cancelled);
    expect(getTaskRunStatus(run("Unknown", "TaskRunCancelled")).phase).toBe(taskRunPhase["in-progress"]);
  });

  it("reports an empty reason as absent so the label never renders empty", () => {
    expect(getTaskRunStatus(run("Unknown", "")).reason).toBeUndefined();
    expect(getTaskRunStatusLabel(getTaskRunStatus(run("Unknown", "")))).toBe("Running");
    expect(getTaskRunStatusLabel(getTaskRunStatus(run("False", "")))).toBe("Failed");
  });
});
