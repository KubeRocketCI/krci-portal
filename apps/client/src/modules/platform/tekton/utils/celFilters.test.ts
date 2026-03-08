import { describe, expect, test } from "vitest";
import { escapeCELString, buildLabelsFilter, buildPipelineRunNameFilter } from "./celFilters";

describe("escapeCELString", () => {
  test("returns valid K8s names unchanged", () => {
    expect(escapeCELString("my-pipeline-dev")).toBe("my-pipeline-dev");
    expect(escapeCELString("pipeline123")).toBe("pipeline123");
    expect(escapeCELString("my.pipeline")).toBe("my.pipeline");
  });

  test("escapes single quotes", () => {
    expect(escapeCELString("name'injection")).toBe("name\\'injection");
  });

  test("escapes backslashes", () => {
    expect(escapeCELString("name\\value")).toBe("name\\\\value");
  });

  test("escapes backslash before single quote", () => {
    expect(escapeCELString("a\\'b")).toBe("a\\\\\\'b");
  });

  test("handles empty string", () => {
    expect(escapeCELString("")).toBe("");
  });

  test("neutralizes CEL injection attempt", () => {
    const malicious = "x' || true || '";
    expect(escapeCELString(malicious)).toBe("x\\' || true || \\'");
  });
});

describe("buildLabelsFilter", () => {
  test("returns undefined for empty labels", () => {
    expect(buildLabelsFilter({})).toBeUndefined();
  });

  test("builds single-label CEL filter", () => {
    const result = buildLabelsFilter({ "tekton.dev/pipeline": "my-pipeline" });

    expect(result).toBe("data.metadata.labels['tekton.dev/pipeline'] == 'my-pipeline'");
  });

  test("builds multi-label CEL filter joined with &&", () => {
    const result = buildLabelsFilter({
      "app.edp.epam.com/codebase": "my-app",
      "app.edp.epam.com/stage": "dev",
    });

    expect(result).toBe(
      "data.metadata.labels['app.edp.epam.com/codebase'] == 'my-app' && data.metadata.labels['app.edp.epam.com/stage'] == 'dev'"
    );
  });

  test("escapes values with single quotes", () => {
    const result = buildLabelsFilter({ "app.edp.epam.com/codebase": "app'injection" });

    expect(result).toBe("data.metadata.labels['app.edp.epam.com/codebase'] == 'app\\'injection'");
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

  test("escapes names with single quotes", () => {
    const result = buildPipelineRunNameFilter("name'with-quote");

    expect(result).toBe("data.metadata.name == 'name\\'with-quote' && data_type == 'tekton.dev/v1.PipelineRun'");
  });
});
