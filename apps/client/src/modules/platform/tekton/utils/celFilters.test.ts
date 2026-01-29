import { describe, expect, test } from "vitest";
import { buildPipelineFilter, buildPipelineRunNameFilter } from "./celFilters";

describe("buildPipelineFilter", () => {
  test("builds CEL filter for pipeline name", () => {
    const result = buildPipelineFilter("my-pipeline");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'my-pipeline'");
  });

  test("handles pipeline names with hyphens", () => {
    const result = buildPipelineFilter("my-test-pipeline");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'my-test-pipeline'");
  });

  test("handles pipeline names with underscores", () => {
    const result = buildPipelineFilter("my_pipeline");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'my_pipeline'");
  });

  test("handles pipeline names with numbers", () => {
    const result = buildPipelineFilter("pipeline123");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'pipeline123'");
  });

  test("handles pipeline names with dots", () => {
    const result = buildPipelineFilter("my.pipeline");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'my.pipeline'");
  });

  test("handles simple pipeline names", () => {
    const result = buildPipelineFilter("build");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'build'");
  });

  test("handles long pipeline names", () => {
    const longName = "very-long-pipeline-name-with-many-segments";
    const result = buildPipelineFilter(longName);

    expect(result).toBe(`annotations['tekton.dev/pipeline'] == '${longName}'`);
  });

  test("handles pipeline names with special characters", () => {
    const result = buildPipelineFilter("pipeline-name_v1.0");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'pipeline-name_v1.0'");
  });

  test("preserves case sensitivity", () => {
    const result = buildPipelineFilter("MyPipeline");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == 'MyPipeline'");
  });

  test("handles empty string", () => {
    const result = buildPipelineFilter("");

    expect(result).toBe("annotations['tekton.dev/pipeline'] == ''");
  });
});

describe("buildPipelineRunNameFilter", () => {
  test("builds CEL filter for PipelineRun name", () => {
    const result = buildPipelineRunNameFilter("my-app-build-abc123");

    expect(result).toBe("annotations['object.metadata.name'] == 'my-app-build-abc123'");
  });

  test("handles typical PipelineRun names with hash suffixes", () => {
    const result = buildPipelineRunNameFilter("gerrit-go-other-app-lib-review-jrzhc");

    expect(result).toBe("annotations['object.metadata.name'] == 'gerrit-go-other-app-lib-review-jrzhc'");
  });

  test("handles PipelineRun names with dots and numbers", () => {
    const result = buildPipelineRunNameFilter("pipeline-run-v1.2.3-build-xyz");

    expect(result).toBe("annotations['object.metadata.name'] == 'pipeline-run-v1.2.3-build-xyz'");
  });

  test("handles empty string", () => {
    const result = buildPipelineRunNameFilter("");

    expect(result).toBe("annotations['object.metadata.name'] == ''");
  });

  test("does not escape single quotes (K8s names cannot contain them)", () => {
    const result = buildPipelineRunNameFilter("name'with-quote");

    expect(result).toBe("annotations['object.metadata.name'] == 'name'with-quote'");
  });
});
