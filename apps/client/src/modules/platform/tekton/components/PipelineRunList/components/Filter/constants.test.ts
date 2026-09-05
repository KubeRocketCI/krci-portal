import { describe, expect, test } from "vitest";
import { PipelineRun, pipelineRunLabels, pipelineType, tektonResultAnnotations } from "@my-project/shared";
import { matchFunctions, normalizePipelineRunFilterUrlValues, pipelineRunFilterControlNames } from "./constants";

const codebasesMatch = matchFunctions[pipelineRunFilterControlNames.CODEBASES]!;
const statusMatch = matchFunctions[pipelineRunFilterControlNames.STATUS]!;

interface PrOverrides {
  type?: string;
  codebaseLabel?: string;
  appsPayload?: string;
  isHistory?: boolean;
}

const makeRun = ({ type, codebaseLabel, appsPayload, isHistory }: PrOverrides): PipelineRun => {
  const labels: Record<string, string> = {};
  if (type) labels[pipelineRunLabels.pipelineType] = type;
  if (codebaseLabel) labels[pipelineRunLabels.codebase] = codebaseLabel;

  const annotations: Record<string, string> = {};
  if (isHistory) annotations[tektonResultAnnotations.historySource] = "true";

  const params = appsPayload !== undefined ? [{ name: "APPLICATIONS_PAYLOAD", value: appsPayload }] : undefined;

  return {
    metadata: { name: "x", namespace: "ns", labels, annotations },
    spec: params ? { params } : {},
  } as unknown as PipelineRun;
};

const makeRunWithCondition = (status: string, reason?: string, isHistory?: boolean): PipelineRun => {
  const annotations: Record<string, string> = {};
  if (isHistory) annotations[tektonResultAnnotations.historySource] = "true";

  return {
    metadata: { name: "x", namespace: "ns", labels: {}, annotations },
    spec: {},
    status: {
      conditions: [{ type: "Succeeded", status, reason }],
    },
  } as unknown as PipelineRun;
};

const makeRunWithNoCondition = (isHistory?: boolean): PipelineRun => {
  const annotations: Record<string, string> = {};
  if (isHistory) annotations[tektonResultAnnotations.historySource] = "true";

  return {
    metadata: { name: "x", namespace: "ns", labels: {}, annotations },
    spec: {},
    status: {},
  } as unknown as PipelineRun;
};

describe("matchFunctions.codebases", () => {
  test("empty selection passes everything", () => {
    expect(codebasesMatch(makeRun({ type: pipelineType.build, codebaseLabel: "x" }), [])).toBe(true);
    expect(codebasesMatch(makeRun({ type: pipelineType.deploy }), [])).toBe(true);
  });

  test("live deploy run with matching APPLICATIONS_PAYLOAD is kept", () => {
    const item = makeRun({
      type: pipelineType.deploy,
      appsPayload: JSON.stringify({ codemie: { url: "x" }, other: { url: "y" } }),
    });
    expect(codebasesMatch(item, ["codemie"])).toBe(true);
    expect(codebasesMatch(item, ["unmatched"])).toBe(false);
  });

  test("live clean run with no APPLICATIONS_PAYLOAD param is dropped", () => {
    const item = makeRun({ type: pipelineType.clean });
    expect(codebasesMatch(item, ["codemie"])).toBe(false);
  });

  test("live deploy run with malformed APPLICATIONS_PAYLOAD does not throw and is dropped", () => {
    const item = makeRun({ type: pipelineType.deploy, appsPayload: "not-json{" });
    expect(() => codebasesMatch(item, ["codemie"])).not.toThrow();
    expect(codebasesMatch(item, ["codemie"])).toBe(false);
  });

  test("history deploy run with matching codebase label is kept (label fallback)", () => {
    const item = makeRun({ type: pipelineType.deploy, codebaseLabel: "codemie", isHistory: true });
    expect(codebasesMatch(item, ["codemie"])).toBe(true);
    expect(codebasesMatch(item, ["other"])).toBe(false);
  });

  test("history clean run without codebase label is dropped", () => {
    const item = makeRun({ type: pipelineType.clean, isHistory: true });
    expect(codebasesMatch(item, ["codemie"])).toBe(false);
  });

  test("live build run with matching codebase label is kept", () => {
    const item = makeRun({ type: pipelineType.build, codebaseLabel: "codemie" });
    expect(codebasesMatch(item, ["codemie"])).toBe(true);
    expect(codebasesMatch(item, ["other"])).toBe(false);
  });

  test("live security/release/tests runs use the codebase label path", () => {
    for (const type of [pipelineType.security, pipelineType.release, pipelineType.tests]) {
      const item = makeRun({ type, codebaseLabel: "codemie" });
      expect(codebasesMatch(item, ["codemie"])).toBe(true);
      expect(codebasesMatch(item, ["other"])).toBe(false);
    }
  });

  test("multiple selected codebases is treated as OR", () => {
    const item = makeRun({ type: pipelineType.build, codebaseLabel: "alpha" });
    expect(codebasesMatch(item, ["alpha", "beta"])).toBe(true);
    expect(codebasesMatch(item, ["beta", "gamma"])).toBe(false);
  });
});

describe("matchFunctions.status", () => {
  test("'all' matches every phase", () => {
    expect(statusMatch(makeRunWithCondition("True"), "all")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "all")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Cancelled"), "all")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "Running"), "all")).toBe(true);
  });

  test("'succeeded' matches only succeeded runs", () => {
    expect(statusMatch(makeRunWithCondition("True"), "succeeded")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "succeeded")).toBe(false);
  });

  test("'in-progress' matches only running/pending live runs", () => {
    expect(statusMatch(makeRunWithCondition("Unknown", "Running"), "in-progress")).toBe(true);
    expect(statusMatch(makeRunWithNoCondition(), "in-progress")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "in-progress")).toBe(false);
  });

  test("'in-progress' excludes archived history runs (terminal, never actually running)", () => {
    const historyUnknown = makeRunWithCondition("Unknown", undefined, true);
    expect(statusMatch(historyUnknown, "in-progress")).toBe(false);
    // Same condition status, but live => genuinely in progress.
    expect(statusMatch(makeRunWithCondition("Unknown", "Running"), "in-progress")).toBe(true);
  });

  test("a stopping run (Unknown + PipelineRunStopping) counts as in-progress, not cancelled", () => {
    expect(statusMatch(makeRunWithCondition("Unknown", "PipelineRunStopping"), "in-progress")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "PipelineRunStopping"), "cancelled")).toBe(false);
  });

  test("a cancelling run (Unknown + a cancel-family reason) counts as cancelled, not in-progress", () => {
    expect(statusMatch(makeRunWithCondition("Unknown", "CancelledRunningFinally"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "CancelledRunningFinally"), "in-progress")).toBe(false);
    expect(statusMatch(makeRunWithCondition("Unknown", "StoppedRunningFinally"), "cancelled")).toBe(true);
  });

  test("'failed' matches failed runs but excludes cancelled/stopped runs", () => {
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "failed")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Cancelled"), "failed")).toBe(false);
    expect(statusMatch(makeRunWithCondition("False", "PipelineRunCancelled"), "failed")).toBe(false);
  });

  test("'cancelled' matches the terminal cancelled phase and the live cancelling phase", () => {
    expect(statusMatch(makeRunWithCondition("False", "Cancelled"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "PipelineRunCancelled"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "CancelledRunningFinally"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "StoppedRunningFinally"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "cancelled")).toBe(false);
    expect(statusMatch(makeRunWithCondition("True"), "cancelled")).toBe(false);
  });
});

describe("normalizePipelineRunFilterUrlValues", () => {
  test("leaves values unchanged when status is absent", () => {
    expect(normalizePipelineRunFilterUrlValues({ search: "x" })).toEqual({ search: "x" });
  });

  test("maps legacy 'true' to 'succeeded'", () => {
    expect(normalizePipelineRunFilterUrlValues({ status: "true" as never })).toEqual({ status: "succeeded" });
  });

  test("maps legacy 'false' to 'failed'", () => {
    expect(normalizePipelineRunFilterUrlValues({ status: "false" as never })).toEqual({ status: "failed" });
  });

  test("maps legacy 'unknown' to 'in-progress'", () => {
    expect(normalizePipelineRunFilterUrlValues({ status: "unknown" as never })).toEqual({ status: "in-progress" });
  });

  test("passes through current phase-based values unchanged", () => {
    for (const status of ["all", "in-progress", "succeeded", "failed", "cancelled"] as const) {
      expect(normalizePipelineRunFilterUrlValues({ status })).toEqual({ status });
    }
  });

  test("falls back to 'all' for a value outside the option list", () => {
    expect(normalizePipelineRunFilterUrlValues({ status: "cancelling" as never })).toEqual({ status: "all" });
    expect(normalizePipelineRunFilterUrlValues({ status: "bogus" as never })).toEqual({ status: "all" });
  });

  test("preserves other filter values while normalizing status", () => {
    expect(normalizePipelineRunFilterUrlValues({ status: "true" as never, search: "keep-me" })).toEqual({
      status: "succeeded",
      search: "keep-me",
    });
  });
});
