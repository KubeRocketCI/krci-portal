import { describe, expect, test } from "vitest";
import { buildPipelineFilter } from "./celFilters";

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
