import { describe, expect, it, test } from "vitest";
import { getTaskRunStatusLabel } from "./index.js";
import { taskRunPhase } from "../../constants.js";

describe("getTaskRunStatusLabel", () => {
  const cases: ReadonlyArray<[Parameters<typeof getTaskRunStatusLabel>[0], string]> = [
    [{ phase: taskRunPhase["in-progress"], reason: undefined }, "Running"],
    [{ phase: taskRunPhase["in-progress"], reason: "started" }, "Running"],
    [{ phase: taskRunPhase["in-progress"], reason: "running" }, "Running"],
    [{ phase: taskRunPhase["in-progress"], reason: "taskrunpending" }, "Pending"],
    [{ phase: taskRunPhase["in-progress"], reason: "pending" }, "Pending"],
    [{ phase: taskRunPhase["in-progress"], reason: "toberetried" }, "Retrying"],
    [{ phase: taskRunPhase["in-progress"], reason: "resolvingtaskref" }, "Resolving"],
    [{ phase: taskRunPhase["in-progress"], reason: "resolvingstepactionref" }, "Resolving"],
    [{ phase: taskRunPhase["in-progress"], reason: "exceedednoderesources" }, "Waiting for resources"],
    [{ phase: taskRunPhase["in-progress"], reason: "exceededresourcequota" }, "Waiting for resources"],
    [{ phase: taskRunPhase.succeeded, reason: "succeeded" }, "Succeeded"],
    [{ phase: taskRunPhase.succeeded, reason: undefined }, "Succeeded"],
    [{ phase: taskRunPhase.failed, reason: undefined }, "Failed"],
    [{ phase: taskRunPhase.cancelled, reason: "taskruncancelled" }, "Cancelled"],
    [{ phase: taskRunPhase.cancelled, reason: "customruncancelled" }, "Cancelled"],
    [{ phase: taskRunPhase.failed, reason: "failed" }, "Failed"],
    [{ phase: taskRunPhase.failed, reason: "taskruntimeout" }, "Timeout"],
    [{ phase: taskRunPhase.failed, reason: "customruntimedout" }, "Timeout"],
    [{ phase: taskRunPhase.failed, reason: "taskrunimagepullfailed" }, "Image pull failed"],
    [{ phase: taskRunPhase.failed, reason: "failureignored" }, "Failed (ignored)"],
    [{ phase: taskRunPhase.failed, reason: "taskrunvalidationfailed" }, "Validation failed"],
    [{ phase: taskRunPhase.failed, reason: "taskvalidationfailed" }, "Validation failed"],
    [{ phase: taskRunPhase.failed, reason: "taskrunresolutionfailed" }, "Resolution failed"],
    [{ phase: taskRunPhase.failed, reason: "taskrunresultlargerthanallowedlimit" }, "Result too large"],
    [{ phase: taskRunPhase.failed, reason: "stepoom" }, "Out of memory"],
    [{ phase: taskRunPhase.failed, reason: "sidecaroom" }, "Out of memory"],
    [{ phase: taskRunPhase.failed, reason: "initcontaineroom" }, "Out of memory"],
    [{ phase: taskRunPhase.failed, reason: "podevicted" }, "Pod evicted"],
    [{ phase: taskRunPhase.failed, reason: "somefutureunmappedreason" }, "Somefutureunmappedreason"],
    [{ phase: taskRunPhase.unknown, reason: undefined }, "Unknown"],
  ];

  for (const [status, expected] of cases) {
    test(`${JSON.stringify(status)} -> ${expected}`, () => {
      expect(getTaskRunStatusLabel(status)).toBe(expected);
    });
  }

  it("keeps the two image-pull reasons apart", () => {
    expect(getTaskRunStatusLabel({ phase: taskRunPhase["in-progress"], reason: "pullimagefailed" })).toBe(
      "Pulling image"
    );
    expect(getTaskRunStatusLabel({ phase: taskRunPhase.failed, reason: "taskrunimagepullfailed" })).toBe(
      "Image pull failed"
    );
  });
});
