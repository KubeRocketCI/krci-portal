import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import React from "react";
import type { K8sResourceConfig } from "@my-project/shared";
import { createTestQueryClient } from "@/test/utils";
import { createK8sNotFoundError } from "@/k8s/api/utils/k8sNotFoundError";
import { deferred } from "@/k8s/api/hooks/useWatch/testUtils";
import { useUnifiedPipelineRunData } from "./data";

const { trpc, registry } = vi.hoisted(() => ({
  trpc: {
    k8s: {
      get: { query: vi.fn() },
      list: { query: vi.fn() },
      discoveryDocument: { query: vi.fn() },
    },
    tektonResults: {
      listRecords: { query: vi.fn() },
      getPipelineRun: { query: vi.fn() },
      getTaskRunRecords: { query: vi.fn() },
      getCustomRunRecords: { query: vi.fn() },
    },
  },
  registry: {
    register: vi.fn(() => vi.fn()),
    startSubscription: vi.fn(),
  },
}));

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: () => trpc }));

vi.mock("@/core/auth/provider", () => ({ useAuth: () => ({ isAuthenticated: true }) }));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: unknown) => unknown) =>
    selector({ clusterName: "test-cluster", defaultNamespace: NAMESPACE }),
}));

vi.mock("@/core/providers/subscriptions", () => ({
  useWatchRegistries: () => ({ watchListRegistry: registry, watchItemRegistry: registry }),
}));

const NAMESPACE = "krci";
const RUN = "build-app-main-abc12";
const buildSpec = { description: "Builds the image", steps: [{ name: "compile" }] };

const pipelineSpec = {
  tasks: [
    { name: "build", taskRef: { kind: "Task", name: "build-image" } },
    { name: "test", taskRef: { kind: "Task", name: "run-tests" }, runAfter: ["build"] },
  ],
};
const childReferences = [{ kind: "TaskRun", name: `${RUN}-build`, pipelineTaskName: "build" }];

const pipelineRun = {
  apiVersion: "tekton.dev/v1",
  kind: "PipelineRun",
  metadata: { name: RUN, namespace: NAMESPACE, resourceVersion: "1" },
  spec: {},
  status: { pipelineSpec, childReferences },
};

const buildTaskRun = {
  apiVersion: "tekton.dev/v1",
  kind: "TaskRun",
  metadata: {
    name: `${RUN}-build`,
    namespace: NAMESPACE,
    labels: { "tekton.dev/pipelineRun": RUN, "tekton.dev/pipelineTask": "build" },
  },
  spec: {},
  status: { podName: `${RUN}-build-pod`, taskSpec: buildSpec },
};

const makeList = (items: unknown[]) => ({ apiVersion: "v1", kind: "List", metadata: { resourceVersion: "10" }, items });

const listedPlurals = () =>
  trpc.k8s.list.query.mock.calls.map(
    ([input]) => (input as { resourceConfig: K8sResourceConfig }).resourceConfig.pluralName
  );

const renderData = () => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return renderHook(() => useUnifiedPipelineRunData({ namespace: NAMESPACE, name: RUN }), { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  trpc.k8s.list.query.mockImplementation(({ resourceConfig }: { resourceConfig: K8sResourceConfig }) =>
    Promise.resolve(makeList(resourceConfig.pluralName === "taskruns" ? [buildTaskRun] : []))
  );
});

describe("useUnifiedPipelineRunData, live run", () => {
  it("starts the run lists together with the PipelineRun request and never lists Tasks", async () => {
    const pipelineRunRequest = deferred<typeof pipelineRun>();
    trpc.k8s.get.query.mockReturnValue(pipelineRunRequest.promise);

    const { result } = renderData();

    await waitFor(() => expect(listedPlurals()).toEqual(["taskruns", "approvaltasks", "customruns"]));
    expect(result.current.isLoading).toBe(true);

    await act(async () => pipelineRunRequest.resolve(pipelineRun));

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.source).toBe("live");
    expect(listedPlurals()).not.toContain("tasks");
  });

  it("takes a started task's spec from its TaskRun and points a pending task at its Task", async () => {
    trpc.k8s.get.query.mockResolvedValue(pipelineRun);

    const { result } = renderData();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    const build = result.current.pipelineRunTasksByNameMap.get("build");
    const test = result.current.pipelineRunTasksByNameMap.get("test");

    expect(build?.taskSpec).toEqual(buildSpec);
    expect(build?.pendingTaskRef).toBeUndefined();
    expect(test?.taskSpec).toBeUndefined();
    expect(test?.pendingTaskRef).toEqual({ namespace: NAMESPACE, name: "run-tests" });
  });
});

describe("useUnifiedPipelineRunData, run not in the cluster", () => {
  beforeEach(() => {
    trpc.k8s.get.query.mockRejectedValue(createK8sNotFoundError(`pipelineruns "${RUN}" not found`));
  });

  it("loads the run from Tekton Results history and points no task at a Task", async () => {
    trpc.tektonResults.listRecords.query.mockResolvedValue({
      records: [{ name: `${NAMESPACE}/results/result-uid/records/record-uid` }],
    });
    trpc.tektonResults.getPipelineRun.query.mockResolvedValue({ pipelineRun });
    trpc.tektonResults.getTaskRunRecords.query.mockResolvedValue({ taskRuns: [buildTaskRun] });
    trpc.tektonResults.getCustomRunRecords.query.mockResolvedValue({ customRuns: [] });

    const { result } = renderData();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.source).toBe("history");
    expect(result.current.pipelineRunTasksByNameMap.get("build")?.taskSpec).toEqual(buildSpec);
    expect(result.current.pipelineRunTasksByNameMap.get("test")?.pendingTaskRef).toBeUndefined();
    expect(listedPlurals()).not.toContain("tasks");
  });

  it("reports not found when history has no record", async () => {
    trpc.tektonResults.listRecords.query.mockResolvedValue({ records: [] });

    const { result } = renderData();

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReady).toBe(false);
  });
});

describe("useUnifiedPipelineRunData, PipelineRun request denied", () => {
  it("does not search history for an error other than not found", async () => {
    trpc.k8s.get.query.mockRejectedValue(
      TRPCClientError.from({
        error: { code: -32603, message: "forbidden", data: { code: "FORBIDDEN", httpStatus: 403 } },
      })
    );

    const { result } = renderData();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isK8sNotFound).toBe(false);
    expect(trpc.tektonResults.listRecords.query).not.toHaveBeenCalled();
  });
});
