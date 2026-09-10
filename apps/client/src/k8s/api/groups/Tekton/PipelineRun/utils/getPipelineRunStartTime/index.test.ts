import { describe, expect, test } from "vitest";
import { getPipelineRunStartTime } from "./index";
import type { PipelineRun } from "@my-project/shared";

const makeRun = (startTime?: string, creationTimestamp?: string): PipelineRun =>
  ({
    metadata: { name: "run", namespace: "ns", creationTimestamp },
    spec: {},
    status: startTime ? { startTime } : {},
  }) as unknown as PipelineRun;

describe("getPipelineRunStartTime", () => {
  test("returns status.startTime once Tekton has started the run", () => {
    expect(getPipelineRunStartTime(makeRun("2026-09-10T12:00:00Z", "2026-09-10T11:00:00Z"))).toBe(
      "2026-09-10T12:00:00Z"
    );
  });

  test("falls back to creationTimestamp for a queued run with no start time", () => {
    expect(getPipelineRunStartTime(makeRun(undefined, "2026-09-10T11:00:00Z"))).toBe("2026-09-10T11:00:00Z");
  });

  test("treats an empty creationTimestamp as absent", () => {
    // Tekton Results history records default creationTimestamp to "".
    expect(getPipelineRunStartTime(makeRun(undefined, ""))).toBeUndefined();
  });

  test("returns undefined when neither timestamp is set", () => {
    expect(getPipelineRunStartTime(makeRun())).toBeUndefined();
  });

  test("orders a queued run ahead of an older started run", () => {
    const started = makeRun("2026-09-10T10:00:00Z", "2026-09-10T10:00:00Z");
    const queued = makeRun(undefined, "2026-09-10T12:00:00Z");

    expect(getPipelineRunStartTime(queued)! > getPipelineRunStartTime(started)!).toBe(true);
  });
});
