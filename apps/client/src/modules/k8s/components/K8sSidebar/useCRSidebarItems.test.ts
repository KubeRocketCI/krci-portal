import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const crds = [
  {
    metadata: { name: "applications.argoproj.io", uid: "u1", creationTimestamp: "" },
    spec: {
      group: "argoproj.io",
      scope: "Namespaced",
      names: { kind: "Application", plural: "applications" },
      versions: [{ name: "v1alpha1", storage: true, served: true }],
    },
  },
  {
    metadata: { name: "pipelineruns.tekton.dev", uid: "u2", creationTimestamp: "" },
    spec: {
      group: "tekton.dev",
      scope: "Namespaced",
      names: { kind: "PipelineRun", plural: "pipelineruns" },
      versions: [{ name: "v1", storage: true, served: true }],
    },
  },
  {
    metadata: { name: "tasks.tekton.dev", uid: "u3", creationTimestamp: "" },
    spec: {
      group: "tekton.dev",
      scope: "Namespaced",
      names: { kind: "Task", plural: "tasks" },
      versions: [{ name: "v1", storage: true, served: true }],
    },
  },
];

const mocked = {
  ret: { data: { array: crds as never[] }, error: null, isLoading: false },
};

vi.mock("@/modules/k8s/hooks/useCRDCatalog", () => ({
  useCRDCatalog: vi.fn(() => mocked.ret),
}));

import { useCRSidebarItems } from "./useCRSidebarItems";

describe("useCRSidebarItems", () => {
  it("groups CRDs by spec.group, sorts groups A-Z, sorts kinds A-Z within", () => {
    const { result } = renderHook(() => useCRSidebarItems("c1"));
    expect(result.current.map((g) => g.title)).toEqual(["argoproj.io", "tekton.dev"]);
    expect(result.current[1].children.map((c) => c.title)).toEqual(["PipelineRun", "Task"]);
  });

  it("uses the storage version in the route URL", () => {
    const { result } = renderHook(() => useCRSidebarItems("c1"));
    const pr = result.current[1].children[0];
    expect(pr.route.params).toMatchObject({ group: "tekton.dev", version: "v1", plural: "pipelineruns" });
  });

  it("returns empty array on catalog error", () => {
    mocked.ret = {
      data: { array: [] },
      error: new Error("boom"),
      isLoading: false,
    } as never;
    const { result } = renderHook(() => useCRSidebarItems("c1"));
    expect(result.current).toEqual([]);
    mocked.ret = { data: { array: crds as never[] }, error: null, isLoading: false };
  });

  it("returns stable identity across renders when CRD data is unchanged", () => {
    const { result, rerender } = renderHook(() => useCRSidebarItems("c1"));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("skips CRDs with an empty spec.group to avoid a broken regex", () => {
    const crdWithEmptyGroup = {
      metadata: { name: "broken.crd", uid: "u99", creationTimestamp: "" },
      spec: {
        group: "",
        scope: "Namespaced",
        names: { kind: "Broken", plural: "brokens" },
        versions: [{ name: "v1", storage: true, served: true }],
      },
    };
    mocked.ret = {
      data: { array: [...crds, crdWithEmptyGroup] as never[] },
      error: null,
      isLoading: false,
    } as never;

    const { result } = renderHook(() => useCRSidebarItems("c1"));
    // The empty-group CRD must not appear in any group's children
    const allChildren = result.current.flatMap((g) => g.children);
    expect(allChildren.every((c) => c.title !== "Broken")).toBe(true);

    // Restore original mock
    mocked.ret = { data: { array: crds as never[] }, error: null, isLoading: false };
  });

  it("does NOT emit a subgroup with an empty title when multiple CRDs have empty spec.group", () => {
    // Two CRDs with empty group — before the fix, byGroup would create a '' key and
    // the outer map would emit a collapsible-subgroup with title:''. After the fix the
    // skip happens at groupBy time so no such entry exists.
    const emptyGroup1 = {
      metadata: { name: "alpha.crd", uid: "u100", creationTimestamp: "" },
      spec: {
        group: "",
        scope: "Namespaced",
        names: { kind: "Alpha", plural: "alphas" },
        versions: [{ name: "v1", storage: true, served: true }],
      },
    };
    const emptyGroup2 = {
      metadata: { name: "beta.crd", uid: "u101", creationTimestamp: "" },
      spec: {
        group: "",
        scope: "Namespaced",
        names: { kind: "Beta", plural: "betas" },
        versions: [{ name: "v1", storage: true, served: true }],
      },
    };
    mocked.ret = {
      data: { array: [...crds, emptyGroup1, emptyGroup2] as never[] },
      error: null,
      isLoading: false,
    } as never;

    const { result } = renderHook(() => useCRSidebarItems("c1"));
    // No subgroup with an empty title must appear
    expect(result.current.every((g) => g.title !== "")).toBe(true);
    // Total subgroup count must equal the number of real groups (argoproj.io + tekton.dev = 2)
    expect(result.current).toHaveLength(2);

    // Restore original mock
    mocked.ret = { data: { array: crds as never[] }, error: null, isLoading: false };
  });

  describe("isActiveFn matches list and detail paths", () => {
    it("matches the CR list path", () => {
      const { result } = renderHook(() => useCRSidebarItems("c1"));
      const pr = result.current[1].children[0]; // tekton.dev > PipelineRun
      expect(pr.isActiveFn!("/c/c1/k8s/cr/tekton.dev/v1/pipelineruns")).toBe(true);
    });

    it("matches the namespaced CR detail path (ns/...)", () => {
      const { result } = renderHook(() => useCRSidebarItems("c1"));
      const pr = result.current[1].children[0];
      expect(pr.isActiveFn!("/c/c1/k8s/cr/ns/tekton.dev/v1/pipelineruns/default/my-run")).toBe(true);
    });

    it("matches the cluster-scoped CR detail path (cluster/...)", () => {
      const { result } = renderHook(() => useCRSidebarItems("c1"));
      const app = result.current[0].children[0]; // argoproj.io > Application
      expect(app.isActiveFn!("/c/c1/k8s/cr/cluster/argoproj.io/v1alpha1/applications/my-app")).toBe(true);
    });

    it("does NOT match paths for a different group or plural", () => {
      const { result } = renderHook(() => useCRSidebarItems("c1"));
      const pr = result.current[1].children[0];
      expect(pr.isActiveFn!("/c/c1/k8s/cr/tekton.dev/v1/tasks")).toBe(false);
      expect(pr.isActiveFn!("/c/c1/k8s/cr/argoproj.io/v1/pipelineruns")).toBe(false);
    });
  });
});
