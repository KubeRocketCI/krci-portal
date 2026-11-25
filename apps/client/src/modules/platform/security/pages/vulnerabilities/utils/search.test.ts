import { PLATFORM_LIST_DEFAULT_PAGE_SIZE } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { searchToInput, withFilters } from "./search";

describe("searchToInput", () => {
  it("asks for the active Runtime findings of the default clusters on the first page when the URL says nothing", () => {
    expect(searchToInput({}, "krci")).toEqual({
      level: "runtime",
      namespace: "krci",
      clusters: undefined,
      workloadNamespace: undefined,
      state: "active",
      severity: undefined,
      vulnerabilityId: undefined,
      component: undefined,
      page: 0,
      pageSize: PLATFORM_LIST_DEFAULT_PAGE_SIZE,
    });
  });

  it("sends the clusters, the namespace of the workloads and the filters of a Runtime list", () => {
    expect(
      searchToInput(
        {
          cluster: ["remote-cluster"],
          namespace: "demo-prod",
          severity: "Critical",
          state: "falsePositive",
          vulnerabilityId: "CVE-2026-0001",
          component: "openssl",
          page: 3,
          rowsPerPage: 50,
        },
        "krci"
      )
    ).toEqual({
      level: "runtime",
      namespace: "krci",
      clusters: ["remote-cluster"],
      workloadNamespace: "demo-prod",
      state: "falsePositive",
      severity: "Critical",
      vulnerabilityId: "CVE-2026-0001",
      component: "openssl",
      page: 2,
      pageSize: 50,
    });
  });

  it("sends the codebase of a Code or Image list and drops the Runtime scope", () => {
    expect(searchToInput({ level: "image", codebase: "demo-app", cluster: ["edge"], namespace: "x" }, "krci")).toEqual({
      level: "image",
      namespace: "krci",
      codebase: "demo-app",
      state: "active",
      severity: undefined,
      vulnerabilityId: undefined,
      component: undefined,
      page: 0,
      pageSize: PLATFORM_LIST_DEFAULT_PAGE_SIZE,
    });
  });

  it("asks a Runtime list for the active findings when the URL names Mitigated, which Runtime does not offer", () => {
    expect(searchToInput({ state: "mitigated" }, "krci")).toMatchObject({ level: "runtime", state: "active" });
    expect(searchToInput({ level: "code", state: "mitigated" }, "krci")).toMatchObject({ state: "mitigated" });
  });
});

describe("withFilters", () => {
  it("starts the list at its first page again when a filter changes", () => {
    expect(withFilters({ page: 4, rowsPerPage: 50, severity: "High" }, { severity: "Low" })).toEqual({
      page: undefined,
      rowsPerPage: 50,
      severity: "Low",
    });
  });

  it("drops the Mitigated state when the list turns to the Runtime level", () => {
    expect(withFilters({ level: "image", state: "mitigated" }, { level: "runtime" })).toEqual({
      level: "runtime",
      state: undefined,
      page: undefined,
    });
  });

  it("keeps a state that the Runtime level offers", () => {
    expect(withFilters({ level: "image", state: "riskAccepted" }, { level: "runtime" })).toMatchObject({
      state: "riskAccepted",
    });
  });
});
