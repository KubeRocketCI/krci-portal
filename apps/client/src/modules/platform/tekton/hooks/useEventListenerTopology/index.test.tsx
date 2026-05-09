import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/utils";

const mocks = {
  el: vi.fn(),
  triggers: vi.fn(),
  bindings: vi.fn(),
  templates: vi.fn(),
  interceptors: vi.fn(),
  clusterInterceptors: vi.fn(),
  gitServers: vi.fn(),
  pipelineRuns: vi.fn(),
};

vi.mock("@/k8s/api/groups/Tekton/EventListener", () => ({
  useEventListenerWatchItem: (p: unknown) => mocks.el(p),
}));
vi.mock("@/k8s/api/groups/Tekton/Trigger", () => ({
  useTriggerWatchList: (p: unknown) => mocks.triggers(p),
}));
vi.mock("@/k8s/api/groups/Tekton/TriggerBinding", () => ({
  useTriggerBindingWatchList: (p: unknown) => mocks.bindings(p),
}));
vi.mock("@/k8s/api/groups/Tekton/TriggerTemplate", () => ({
  useTriggerTemplateWatchList: (p: unknown) => mocks.templates(p),
}));
vi.mock("@/k8s/api/groups/Tekton/Interceptor", () => ({
  useInterceptorWatchList: (p: unknown) => mocks.interceptors(p),
}));
vi.mock("@/k8s/api/groups/Tekton/ClusterInterceptor", () => ({
  useClusterInterceptorWatchList: (p: unknown) => mocks.clusterInterceptors(p),
}));
vi.mock("@/k8s/api/groups/KRCI/GitServer", () => ({
  useGitServerWatchList: (p: unknown) => mocks.gitServers(p),
}));
vi.mock("@/k8s/api/groups/Tekton/PipelineRun", () => ({
  usePipelineRunWatchList: (p: unknown) => mocks.pipelineRuns(p),
}));

import { useEventListenerTopology } from "./index";

const wrap =
  (qc: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

const okList = (arr: Array<{ metadata: { name: string } }>) => ({
  data: {
    array: arr,
    map: new Map(arr.map((a) => [a.metadata.name, a])),
  },
  isReady: true,
  query: { isSuccess: true, isError: false },
});

const erroredList = () => ({
  data: { array: [], map: new Map() },
  isReady: false,
  query: { isSuccess: false, isError: true },
});

describe("useEventListenerTopology", () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = createTestQueryClient();
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it("returns isReady=false while any underlying watch is still loading (not yet settled)", () => {
    // EL watch still pending — isReady=false AND no error means "loading".
    mocks.el.mockReturnValue({ data: undefined, isReady: false, query: { isSuccess: false, isError: false } });
    [
      mocks.triggers,
      mocks.bindings,
      mocks.templates,
      mocks.interceptors,
      mocks.clusterInterceptors,
      mocks.gitServers,
      mocks.pipelineRuns,
    ].forEach((m) =>
      m.mockReturnValue({
        data: { array: [], map: new Map() },
        isReady: true,
        query: { isSuccess: true, isError: false },
      })
    );
    const { result } = renderHook(() => useEventListenerTopology({ name: "el", namespace: "ns" }), {
      wrapper: wrap(qc),
    });
    expect(result.current.isReady).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("forwards EL labels (e.g. triggers.tekton.dev/eventlistener) to PipelineRun watch", () => {
    mocks.el.mockReturnValue({
      data: {
        metadata: {
          name: "el",
          namespace: "ns",
          labels: {},
          uid: "x",
          creationTimestamp: "2025-01-01T00:00:00Z",
        },
        spec: { triggers: [] },
      },
      isReady: true,
      query: { isSuccess: true, isError: false },
    });
    [
      mocks.triggers,
      mocks.bindings,
      mocks.templates,
      mocks.interceptors,
      mocks.clusterInterceptors,
      mocks.gitServers,
      mocks.pipelineRuns,
    ].forEach((m) => m.mockReturnValue(okList([])));
    renderHook(() => useEventListenerTopology({ name: "el", namespace: "ns" }), { wrapper: wrap(qc) });
    expect(mocks.pipelineRuns).toHaveBeenCalledWith({
      namespace: "ns",
      labels: { "triggers.tekton.dev/eventlistener": "el" },
    });
  });

  it("invokes buildTopology and returns its result when everything is ready", () => {
    mocks.el.mockReturnValue({
      data: {
        metadata: {
          name: "el",
          namespace: "ns",
          labels: {},
          uid: "x",
          creationTimestamp: "2025-01-01T00:00:00Z",
        },
        spec: { triggers: [] },
        status: { address: { url: "http://x" }, conditions: [{ type: "Ready", status: "True" }] },
      },
      isReady: true,
      query: { isSuccess: true, isError: false },
    });
    [
      mocks.triggers,
      mocks.bindings,
      mocks.templates,
      mocks.interceptors,
      mocks.clusterInterceptors,
      mocks.gitServers,
      mocks.pipelineRuns,
    ].forEach((m) => m.mockReturnValue(okList([])));
    const { result } = renderHook(() => useEventListenerTopology({ name: "el", namespace: "ns" }), {
      wrapper: wrap(qc),
    });
    expect(result.current.isReady).toBe(true);
    expect(result.current.data?.address).toBe("http://x");
    expect(result.current.data?.ready).toBe(true);
  });

  // Regression: a non-admin portal user often lacks RBAC for cluster-scoped
  // resources (ClusterInterceptor) and may also lack list permission on
  // namespaced Trigger CRDs. The strict AND-of-isReady previously deadlocked
  // the page on such failures and rendered an infinite spinner.
  it("becomes ready and produces a partial topology when secondary watches error (e.g. 403)", () => {
    mocks.el.mockReturnValue({
      data: {
        metadata: {
          name: "el",
          namespace: "ns",
          labels: {},
          uid: "x",
          creationTimestamp: "2025-01-01T00:00:00Z",
        },
        spec: {
          // Inline trigger so its interceptors live on the EL spec directly,
          // exercising the cluster-interceptor lookup against the errored
          // ClusterInterceptor watch (empty fallback map).
          triggers: [
            {
              name: "inline-tr",
              interceptors: [{ ref: { name: "missing-cluster-i", kind: "ClusterInterceptor" } }],
              bindings: [],
              template: { ref: "" },
            },
          ],
        },
        status: { address: { url: "http://x" }, conditions: [{ type: "Ready", status: "True" }] },
      },
      isReady: true,
      query: { isSuccess: true, isError: false },
    });
    // Trigger and ClusterInterceptor watches errored (403 / missing CRD).
    mocks.triggers.mockReturnValue(erroredList());
    mocks.clusterInterceptors.mockReturnValue(erroredList());
    // The rest succeeded.
    [mocks.bindings, mocks.templates, mocks.interceptors, mocks.gitServers, mocks.pipelineRuns].forEach((m) =>
      m.mockReturnValue(okList([]))
    );

    const { result } = renderHook(() => useEventListenerTopology({ name: "el", namespace: "ns" }), {
      wrapper: wrap(qc),
    });
    expect(result.current.isReady).toBe(true);
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.triggers).toHaveLength(1);
    expect(result.current.data?.triggers[0]?.source).toEqual({ kind: "inline", name: "inline-tr" });
    // The ClusterInterceptor watch errored — the ref is reported as
    // "restricted" (not "missing"), so the UI can tell the user the
    // resource may exist but isn't visible to them.
    const interceptor = result.current.data?.triggers[0]?.interceptors[0];
    expect(interceptor?.resolved).toBeNull();
    expect(interceptor?.status).toBe("restricted");
  });
});
