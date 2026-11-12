import { describe, expect, it } from "vitest";
import { CODEBASE_DIVIDER_VALUE } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { arePipelineRunViewFiltersEqual, toPipelineRunViewFilters } from "./pipelineRunViewFilters";

describe("toPipelineRunViewFilters", () => {
  it("drops defaults", () => {
    expect(
      toPipelineRunViewFilters({ search: "", status: "all", pipelineType: "all", codebases: [], namespaces: [] })
    ).toEqual({});
  });

  it("keeps the page filters that differ from defaults", () => {
    expect(
      toPipelineRunViewFilters({
        search: "review-",
        status: "failed",
        pipelineType: "build",
        codebases: ["codemie", "codemie-ui"],
        namespaces: ["krci"],
      })
    ).toEqual({
      search: "review-",
      status: "failed",
      pipelineType: "build",
      codebases: ["codemie", "codemie-ui"],
      namespaces: ["krci"],
    });
  });

  it("drops keys the page does not show", () => {
    expect(toPipelineRunViewFilters({ codebaseBranches: ["main"], page: 2, codebases: ["a"] })).toEqual({
      codebases: ["a"],
    });
  });

  it("normalizes legacy status values", () => {
    expect(toPipelineRunViewFilters({ status: "true" })).toEqual({ status: "succeeded" });
  });

  it("coerces a single string to an array, dedupes, and strips non-strings and the divider", () => {
    expect(toPipelineRunViewFilters({ codebases: "a" })).toEqual({ codebases: ["a"] });
    expect(toPipelineRunViewFilters({ codebases: ["a", "a", 1, null, CODEBASE_DIVIDER_VALUE, "b"] })).toEqual({
      codebases: ["a", "b"],
    });
  });

  it("drops values of the wrong type", () => {
    expect(toPipelineRunViewFilters({ search: 5, pipelineType: ["build"], status: { x: 1 } })).toEqual({});
  });

  it("drops namespaces when the page hides the Namespaces control", () => {
    expect(toPipelineRunViewFilters({ namespaces: ["krci"], status: "failed" }, { includeNamespaces: false })).toEqual({
      status: "failed",
    });
  });

  it("treats undefined as no filters", () => {
    expect(toPipelineRunViewFilters(undefined)).toEqual({});
  });
});

describe("arePipelineRunViewFiltersEqual", () => {
  it("ignores key and array order", () => {
    expect(
      arePipelineRunViewFiltersEqual(
        { codebases: ["b", "a"], status: "failed" },
        { status: "failed", codebases: ["a", "b"] }
      )
    ).toBe(true);
  });

  it("detects a changed, added or removed value", () => {
    expect(arePipelineRunViewFiltersEqual({ codebases: ["a"] }, { codebases: ["a", "b"] })).toBe(false);
    expect(arePipelineRunViewFiltersEqual({ codebases: ["a"] }, { codebases: ["a"], status: "failed" })).toBe(false);
    expect(arePipelineRunViewFiltersEqual({ status: "failed" }, {})).toBe(false);
  });
});
