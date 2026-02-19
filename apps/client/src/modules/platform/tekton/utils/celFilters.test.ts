import { describe, expect, test } from "vitest";
import { buildPipelineFilter, buildPipelineRunNameFilter, buildStageFilter } from "./celFilters";

describe("buildPipelineFilter", () => {
  test("builds CEL filter for pipeline name", () => {
    const result = buildPipelineFilter("my-pipeline");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'my-pipeline' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles pipeline names with hyphens", () => {
    const result = buildPipelineFilter("my-test-pipeline");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'my-test-pipeline' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles pipeline names with underscores", () => {
    const result = buildPipelineFilter("my_pipeline");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'my_pipeline' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles pipeline names with numbers", () => {
    const result = buildPipelineFilter("pipeline123");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'pipeline123' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles pipeline names with dots", () => {
    const result = buildPipelineFilter("my.pipeline");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'my.pipeline' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles simple pipeline names", () => {
    const result = buildPipelineFilter("build");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'build' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles long pipeline names", () => {
    const longName = "very-long-pipeline-name-with-many-segments";
    const result = buildPipelineFilter(longName);

    expect(result).toBe(
      `data.metadata.labels['tekton.dev/pipeline'] == '${longName}' && data_type == 'tekton.dev/v1.PipelineRun'`
    );
  });

  test("handles pipeline names with special characters", () => {
    const result = buildPipelineFilter("pipeline-name_v1.0");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'pipeline-name_v1.0' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("preserves case sensitivity", () => {
    const result = buildPipelineFilter("MyPipeline");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == 'MyPipeline' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles empty string", () => {
    const result = buildPipelineFilter("");

    expect(result).toBe(
      "data.metadata.labels['tekton.dev/pipeline'] == '' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });
});

describe("buildPipelineRunNameFilter", () => {
  test("builds CEL filter for PipelineRun name", () => {
    const result = buildPipelineRunNameFilter("my-app-build-abc123");

    expect(result).toBe("data.metadata.name == 'my-app-build-abc123' && data_type == 'tekton.dev/v1.PipelineRun'");
  });

  test("handles typical PipelineRun names with hash suffixes", () => {
    const result = buildPipelineRunNameFilter("gerrit-go-other-app-lib-review-jrzhc");

    expect(result).toBe(
      "data.metadata.name == 'gerrit-go-other-app-lib-review-jrzhc' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles PipelineRun names with dots and numbers", () => {
    const result = buildPipelineRunNameFilter("pipeline-run-v1.2.3-build-xyz");

    expect(result).toBe(
      "data.metadata.name == 'pipeline-run-v1.2.3-build-xyz' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles empty string", () => {
    const result = buildPipelineRunNameFilter("");

    expect(result).toBe("data.metadata.name == '' && data_type == 'tekton.dev/v1.PipelineRun'");
  });

  test("handles names with single quotes", () => {
    const result = buildPipelineRunNameFilter("name'with-quote");

    expect(result).toBe("data.metadata.name == 'name'with-quote' && data_type == 'tekton.dev/v1.PipelineRun'");
  });
});

describe("buildStageFilter", () => {
  test("builds CEL filter for stage label", () => {
    const result = buildStageFilter("my-pipeline-dev");

    expect(result).toBe(
      "data.metadata.labels['app.edp.epam.com/stage'] == 'my-pipeline-dev' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });

  test("handles stage labels with hyphens", () => {
    const result = buildStageFilter("vp-test-pipelin-dev");

    expect(result).toBe(
      "data.metadata.labels['app.edp.epam.com/stage'] == 'vp-test-pipelin-dev' && data_type == 'tekton.dev/v1.PipelineRun'"
    );
  });
});
