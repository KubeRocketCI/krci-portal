import { PLATFORM_LIST_DEFAULT_PAGE_SIZE } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { searchToInputs, withFilters, withPage, withRowsPerPage } from "./search";

describe("searchToInputs", () => {
  it("asks both lists for active secrets on their first page when the URL says nothing", () => {
    expect(searchToInputs({}, "krci")).toEqual({
      code: {
        level: "code",
        namespace: "krci",
        codebase: undefined,
        state: "active",
        severity: undefined,
        page: 0,
        pageSize: PLATFORM_LIST_DEFAULT_PAGE_SIZE,
      },
      runtime: {
        level: "runtime",
        namespace: "krci",
        clusters: undefined,
        workloadNamespace: undefined,
        state: "active",
        severity: undefined,
        page: 0,
        pageSize: PLATFORM_LIST_DEFAULT_PAGE_SIZE,
      },
    });
  });

  it("gives the codebase to the code list and the clusters and namespace to the runtime list, each its own page", () => {
    const { code, runtime } = searchToInputs(
      { codebase: "demo-app", cluster: ["edge"], namespace: "ingress", severity: "High", codePage: 2, runtimePage: 4 },
      "krci"
    );

    expect(code).toMatchObject({ codebase: "demo-app", severity: "High", page: 1 });
    expect(code).not.toHaveProperty("clusters");
    expect(runtime).toMatchObject({ clusters: ["edge"], workloadNamespace: "ingress", severity: "High", page: 3 });
    expect(runtime).not.toHaveProperty("codebase");
  });

  it("sends no runtime request for Mitigated, which Runtime does not offer", () => {
    expect(searchToInputs({ state: "mitigated" }, "krci")).toMatchObject({
      code: { state: "mitigated" },
      runtime: null,
    });
  });
});

describe("withFilters", () => {
  it("starts both lists at their first page again when a filter changes", () => {
    expect(withFilters({ codePage: 3, runtimePage: 2, rowsPerPage: 50 }, { severity: "Low" })).toEqual({
      severity: "Low",
      codePage: undefined,
      runtimePage: undefined,
      rowsPerPage: 50,
    });
  });

  it("keeps Mitigated, which the code list offers", () => {
    expect(withFilters({}, { state: "mitigated" }).state).toBe("mitigated");
  });
});

describe("withRowsPerPage", () => {
  it("starts both lists at their first page again with the new size", () => {
    expect(withRowsPerPage({ codePage: 3, runtimePage: 2, severity: "High" }, 50)).toEqual({
      severity: "High",
      rowsPerPage: 50,
      codePage: undefined,
      runtimePage: undefined,
    });
  });
});

describe("withPage", () => {
  it("turns the 0-based page of a table into the 1-based page of its own list only", () => {
    expect(withPage({ codePage: 2, runtimePage: 3 }, "code", 4)).toEqual({ codePage: 5, runtimePage: 3 });
    expect(withPage({ codePage: 2, runtimePage: 3 }, "runtime", 0)).toEqual({ codePage: 2, runtimePage: 1 });
  });
});
