import { describe, expect, it } from "vitest";
import { getPipelineRunAnnotation } from "./index.js";
import { PipelineRun } from "../../types.js";

describe("getPipelineRunAnnotation", () => {
  it("should extract annotation from resultAnnotations JSON", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "app.edp.epam.com/git-author": "Jane Smith",
            "app.edp.epam.com/git-avatar": "https://example.com/avatar.jpg",
            "app.edp.epam.com/git-change-number": "123",
          }),
        },
      },
    } as unknown as PipelineRun;

    const author = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(author).toBe("Jane Smith");

    const avatar = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-avatar");
    expect(avatar).toBe("https://example.com/avatar.jpg");

    const changeNumber = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-change-number");
    expect(changeNumber).toBe("123");
  });

  it("should return undefined for non-existent keys in resultAnnotations", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "some-other-key": "value",
          }),
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should return undefined when resultAnnotations doesn't exist", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "some-other-annotation": "value",
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should handle missing annotations gracefully", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should handle invalid JSON in resultAnnotations gracefully", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": "invalid json {",
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should handle empty resultAnnotations JSON", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": JSON.stringify({}),
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should return undefined for empty string values", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "app.edp.epam.com/git-author": "",
          }),
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should return undefined for null values", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "app.edp.epam.com/git-author": null,
          }),
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
    expect(result).toBeUndefined();
  });

  it("should convert non-string values to strings", () => {
    const pipelineRun = {
      metadata: {
        name: "test-pipeline-run",
        namespace: "default",
        annotations: {
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "app.edp.epam.com/build-number": 42,
          }),
        },
      },
    } as unknown as PipelineRun;

    const result = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/build-number");
    expect(result).toBe("42");
  });
});
