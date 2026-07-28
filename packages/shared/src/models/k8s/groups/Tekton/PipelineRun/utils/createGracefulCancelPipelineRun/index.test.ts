import { describe, expect, it } from "vitest";
import { createGracefulCancelPipelineRun } from "./index.js";
import { PipelineRun } from "../../types.js";

// Cast is safe: the util reads nothing outside spec.status and metadata.annotations.
function buildPipelineRun(annotations?: Record<string, string>): PipelineRun {
  return {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name: "test-pipeline-run",
      namespace: "edp",
      annotations,
    },
    spec: {
      pipelineRef: { name: "test-build-pipeline" },
    },
  } as unknown as PipelineRun;
}

describe("createGracefulCancelPipelineRun", () => {
  it("sets spec.status to CancelledRunFinally", () => {
    const result = createGracefulCancelPipelineRun(buildPipelineRun());

    expect(result.spec.status).toBe("CancelledRunFinally");
  });

  it("stamps the queue-cancel-reason annotation with 'user-cancelled'", () => {
    const result = createGracefulCancelPipelineRun(buildPipelineRun());

    expect(result.metadata.annotations).toMatchObject({
      "app.edp.epam.com/queue-cancel-reason": "user-cancelled",
    });
  });

  it("overwrites a reason previously stamped by the queue operator", () => {
    const result = createGracefulCancelPipelineRun(
      buildPipelineRun({ "app.edp.epam.com/queue-cancel-reason": "superseded" })
    );

    expect(result.metadata.annotations?.["app.edp.epam.com/queue-cancel-reason"]).toBe("user-cancelled");
  });

  it("preserves existing annotations", () => {
    const result = createGracefulCancelPipelineRun(
      buildPipelineRun({
        "argocd.argoproj.io/compare-options": "IgnoreExtraneous",
        "app.edp.epam.com/git-author": "test-user",
      })
    );

    expect(result.metadata.annotations).toEqual({
      "argocd.argoproj.io/compare-options": "IgnoreExtraneous",
      "app.edp.epam.com/git-author": "test-user",
      "app.edp.epam.com/queue-cancel-reason": "user-cancelled",
    });
  });

  it("does not mutate the original pipeline run", () => {
    const original = buildPipelineRun({ "some-annotation": "value" });

    createGracefulCancelPipelineRun(original);

    expect(original.spec.status).toBeUndefined();
    expect(original.metadata.annotations).toEqual({ "some-annotation": "value" });
  });
});
