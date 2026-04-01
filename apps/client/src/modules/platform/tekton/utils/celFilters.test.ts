import { describe, expect, test } from "vitest";
import { escapeCELString, buildPipelineRunNameFilter, buildAnnotationsFilter } from "./celFilters";

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

describe("buildAnnotationsFilter", () => {
  test("returns undefined for empty annotations record", () => {
    expect(buildAnnotationsFilter({})).toBeUndefined();
  });

  test("builds single annotation clause", () => {
    const result = buildAnnotationsFilter({
      "app.edp.epam.com/codebase": "codemie",
    });

    expect(result).toBe(`annotations["app.edp.epam.com/codebase"] == 'codemie'`);
  });

  test("builds multiple annotation clauses joined with &&", () => {
    const result = buildAnnotationsFilter({
      "app.edp.epam.com/codebase": "codemie",
      "app.edp.epam.com/pipelinetype": "review",
    });

    expect(result).toBe(
      `annotations["app.edp.epam.com/codebase"] == 'codemie' && annotations["app.edp.epam.com/pipelinetype"] == 'review'`
    );
  });

  test("escapes single quotes in annotation values", () => {
    const result = buildAnnotationsFilter({
      "app.edp.epam.com/codebase": "name'with-quote",
    });

    expect(result).toBe(`annotations["app.edp.epam.com/codebase"] == 'name\\'with-quote'`);
  });

  test("escapes backslashes in annotation values", () => {
    const result = buildAnnotationsFilter({
      "app.edp.epam.com/codebase": "name\\value",
    });

    expect(result).toBe(`annotations["app.edp.epam.com/codebase"] == 'name\\\\value'`);
  });

  test("handles typical K8s label selectors", () => {
    const result = buildAnnotationsFilter({
      "tekton.dev/pipeline": "gitlab-poetry-fastapi-app-review",
      "app.edp.epam.com/codebasebranch": "codemie-main",
    });

    expect(result).toBe(
      `annotations["tekton.dev/pipeline"] == 'gitlab-poetry-fastapi-app-review' && annotations["app.edp.epam.com/codebasebranch"] == 'codemie-main'`
    );
  });
});
