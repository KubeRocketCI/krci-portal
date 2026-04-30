import { describe, expect, test } from "vitest";
import {
  escapeCELString,
  buildPipelineRunNameFilter,
  buildAnnotationsFilter,
  buildNameSearchFilter,
  buildStatusFilter,
  buildPipelineTypeFilter,
  buildCodebaseFilter,
} from "./celFilters";

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

describe("buildNameSearchFilter", () => {
  test("returns undefined for empty string", () => {
    expect(buildNameSearchFilter("")).toBeUndefined();
  });

  test("returns undefined for whitespace-only string", () => {
    expect(buildNameSearchFilter("   ")).toBeUndefined();
  });

  test("builds CEL contains filter for a normal search term", () => {
    const result = buildNameSearchFilter("my-build-abc123");

    expect(result).toBe(`annotations["object.metadata.name"].contains('my-build-abc123')`);
  });

  test("trims whitespace from the search term", () => {
    const result = buildNameSearchFilter("  deploy  ");

    expect(result).toBe(`annotations["object.metadata.name"].contains('deploy')`);
  });

  test("escapes single quotes in search term", () => {
    const result = buildNameSearchFilter("name'injection");

    expect(result).toBe(`annotations["object.metadata.name"].contains('name\\'injection')`);
  });

  test("escapes backslashes in search term", () => {
    const result = buildNameSearchFilter("name\\value");

    expect(result).toBe(`annotations["object.metadata.name"].contains('name\\\\value')`);
  });
});

describe("buildStatusFilter", () => {
  test("returns undefined for 'all'", () => {
    expect(buildStatusFilter("all")).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    expect(buildStatusFilter("")).toBeUndefined();
  });

  test("returns undefined for unrecognized value", () => {
    expect(buildStatusFilter("bogus")).toBeUndefined();
  });

  test("maps 'true' (Succeeded) to summary.status == 1", () => {
    expect(buildStatusFilter("true")).toBe("summary.status == 1");
  });

  test("maps 'false' (Failed) to OR of FAILURE / CANCELLED / TIMEOUT enum ints", () => {
    expect(buildStatusFilter("false")).toBe("(summary.status == 2 || summary.status == 3 || summary.status == 4)");
  });

  test("maps 'unknown' (Pending/Running) to summary.status == 0", () => {
    expect(buildStatusFilter("unknown")).toBe("summary.status == 0");
  });
});

describe("buildPipelineTypeFilter", () => {
  test("returns undefined for 'all'", () => {
    expect(buildPipelineTypeFilter("all")).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    expect(buildPipelineTypeFilter("")).toBeUndefined();
  });

  test("builds annotation equality clause for 'build'", () => {
    expect(buildPipelineTypeFilter("build")).toBe(`annotations["app.edp.epam.com/pipelinetype"] == 'build'`);
  });

  test("builds annotation equality clause for 'review'", () => {
    expect(buildPipelineTypeFilter("review")).toBe(`annotations["app.edp.epam.com/pipelinetype"] == 'review'`);
  });

  test("escapes single quotes in the value (defense in depth)", () => {
    expect(buildPipelineTypeFilter("name'inj")).toBe(`annotations["app.edp.epam.com/pipelinetype"] == 'name\\'inj'`);
  });
});

describe("buildCodebaseFilter", () => {
  test("returns undefined for empty array regardless of pipelineType", () => {
    expect(buildCodebaseFilter([], "build")).toBeUndefined();
    expect(buildCodebaseFilter([], "deploy")).toBeUndefined();
    expect(buildCodebaseFilter([], "all")).toBeUndefined();
    expect(buildCodebaseFilter([], undefined)).toBeUndefined();
  });

  test("returns undefined when pipelineType is 'deploy' (codebase lives in APPLICATIONS_PAYLOAD)", () => {
    expect(buildCodebaseFilter(["codemie"], "deploy")).toBeUndefined();
    expect(buildCodebaseFilter(["a", "b"], "deploy")).toBeUndefined();
  });

  test("returns undefined when pipelineType is 'clean'", () => {
    expect(buildCodebaseFilter(["codemie"], "clean")).toBeUndefined();
  });

  test("builds annotation clause when pipelineType is 'all' (annotation IS reliable for build/review/etc.)", () => {
    expect(buildCodebaseFilter(["codemie"], "all")).toBe(`annotations["app.edp.epam.com/codebase"] == 'codemie'`);
  });

  test("builds annotation clause for 'build' / 'review' / 'security' / 'release' / 'tests'", () => {
    for (const pt of ["build", "review", "security", "release", "tests"]) {
      expect(buildCodebaseFilter(["codemie"], pt)).toBe(`annotations["app.edp.epam.com/codebase"] == 'codemie'`);
    }
  });

  test("joins multiple codebases with OR inside parentheses", () => {
    expect(buildCodebaseFilter(["a", "b"], "review")).toBe(
      `(annotations["app.edp.epam.com/codebase"] == 'a' || annotations["app.edp.epam.com/codebase"] == 'b')`
    );
  });

  test("escapes single quotes in codebase name", () => {
    expect(buildCodebaseFilter(["name'inj"], "build")).toBe(`annotations["app.edp.epam.com/codebase"] == 'name\\'inj'`);
  });
});
