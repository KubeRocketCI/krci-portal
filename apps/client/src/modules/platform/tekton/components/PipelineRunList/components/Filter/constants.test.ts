import { describe, expect, test } from "vitest";
import { PipelineRun, pipelineRunLabels, pipelineType, tektonResultAnnotations } from "@my-project/shared";
import { matchFunctions, pipelineRunFilterControlNames } from "./constants";

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

const makeRunWithCondition = (status: string, reason?: string): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns", labels: {}, annotations: {} },
    spec: {},
    status: {
      conditions: [{ status, reason }],
    },
  }) as unknown as PipelineRun;

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
  test("'all' matches every status", () => {
    expect(statusMatch(makeRunWithCondition("True"), "all")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "all")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Cancelled"), "all")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "Running"), "all")).toBe(true);
  });

  test("'true' matches only succeeded runs", () => {
    expect(statusMatch(makeRunWithCondition("True"), "true")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "true")).toBe(false);
  });

  test("'unknown' matches only running/pending runs", () => {
    expect(statusMatch(makeRunWithCondition("Unknown", "Running"), "unknown")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "unknown")).toBe(false);
  });

  test("a stopping run (Unknown + PipelineRunStopping) counts as cancelled, not unknown", () => {
    // Regression: Tekton reports an in-flight stop as condition status "Unknown".
    // It renders as grey "Cancelled" everywhere, so the filter must agree.
    expect(statusMatch(makeRunWithCondition("Unknown", "PipelineRunStopping"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("Unknown", "PipelineRunStopping"), "unknown")).toBe(false);
  });

  test("'false' matches failed runs but excludes cancelled/stopped runs", () => {
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "false")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Cancelled"), "false")).toBe(false);
    expect(statusMatch(makeRunWithCondition("False", "CancelledRunningFinally"), "false")).toBe(false);
    expect(statusMatch(makeRunWithCondition("False", "StoppedRunningFinally"), "false")).toBe(false);
    expect(statusMatch(makeRunWithCondition("False", "PipelineRunStopping"), "false")).toBe(false);
  });

  test("'cancelled' matches only cancelled/stopped runs", () => {
    expect(statusMatch(makeRunWithCondition("False", "Cancelled"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "CancelledRunningFinally"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "StoppedRunningFinally"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "PipelineRunStopping"), "cancelled")).toBe(true);
    expect(statusMatch(makeRunWithCondition("False", "Failed"), "cancelled")).toBe(false);
    expect(statusMatch(makeRunWithCondition("True"), "cancelled")).toBe(false);
  });
});
