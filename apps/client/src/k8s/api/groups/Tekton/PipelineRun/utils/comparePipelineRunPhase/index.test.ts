import { describe, expect, test } from "vitest";
import { comparePipelineRunPhase } from "./index";
import { tektonResultAnnotations } from "@my-project/shared";
import type { PipelineRun } from "@my-project/shared";

const makeRun = (status: string, reason?: string, annotations: Record<string, string> = {}): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns", labels: {}, annotations },
    spec: {},
    status: { conditions: [{ type: "Succeeded", status, reason }] },
  }) as unknown as PipelineRun;

// Unknown status on an archived Tekton Results record with no usable reason is the only way to get `unknown`.
const makeUnknownRun = (): PipelineRun =>
  makeRun("Unknown", undefined, { [tektonResultAnnotations.historySource]: "true" });

describe("comparePipelineRunPhase", () => {
  test("in-progress sorts before failed", () => {
    const inProgress = makeRun("Unknown", "Running");
    const failed = makeRun("False", "Failed");

    expect(comparePipelineRunPhase(inProgress, failed)).toBeLessThan(0);
  });

  test("failed sorts before succeeded", () => {
    const failed = makeRun("False", "Failed");
    const succeeded = makeRun("True", "Succeeded");

    expect(comparePipelineRunPhase(failed, succeeded)).toBeLessThan(0);
  });

  test("equal phases return 0", () => {
    const a = makeRun("True", "Succeeded");
    const b = makeRun("True", "Succeeded");

    expect(comparePipelineRunPhase(a, b)).toBe(0);
  });

  test("unknown sorts after succeeded", () => {
    const unknown = makeUnknownRun();
    const succeeded = makeRun("True", "Succeeded");

    expect(comparePipelineRunPhase(succeeded, unknown)).toBeLessThan(0);
  });
});
