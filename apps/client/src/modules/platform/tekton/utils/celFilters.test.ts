import { describe, expect, test } from "vitest";
import {
  buildPipelineRunNameFilter,
  buildAnnotationsFilter,
  buildNameSearchFilter,
  buildSummaryStatusClause,
  buildPipelineTypeFilter,
  buildCodebaseFilter,
} from "./celFilters";

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

  test("throws for names containing a single quote", () => {
    expect(() => buildPipelineRunNameFilter("name'with-quote")).toThrow();
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

  test("throws when an annotation value contains a single quote", () => {
    expect(() =>
      buildAnnotationsFilter({
        "app.edp.epam.com/codebase": "name'with-quote",
      })
    ).toThrow();
  });

  test("throws when an annotation value contains a backslash", () => {
    expect(() =>
      buildAnnotationsFilter({
        "app.edp.epam.com/codebase": "name\\value",
      })
    ).toThrow();
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

  test("returns undefined for a search term with a single quote", () => {
    expect(buildNameSearchFilter("name'injection")).toBeUndefined();
  });

  test("returns undefined for a search term with a backslash", () => {
    expect(buildNameSearchFilter("name\\value")).toBeUndefined();
  });

  test("returns undefined for a CEL injection attempt", () => {
    expect(buildNameSearchFilter("x' || true || '")).toBeUndefined();
  });
});

describe("buildSummaryStatusClause", () => {
  test("builds a single equality clause for one int", () => {
    expect(buildSummaryStatusClause([1])).toBe("summary.status == 1");
  });

  test("builds an OR clause in parentheses for multiple ints", () => {
    expect(buildSummaryStatusClause([2, 3])).toBe("(summary.status == 2 || summary.status == 3)");
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

  test("throws when the value contains a single quote", () => {
    expect(() => buildPipelineTypeFilter("name'inj")).toThrow();
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

  test("throws when a codebase name contains a single quote", () => {
    expect(() => buildCodebaseFilter(["name'inj"], "build")).toThrow();
  });
});
