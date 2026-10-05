import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { k8sTaskConfig, TaskRun } from "@my-project/shared";
import { createTestQueryClient } from "@/test/utils";
import { createK8sNotFoundError } from "@/k8s/api/utils/k8sNotFoundError";
import { usePipelineTaskSpec, usePrefetchPipelineTaskSpec } from "./usePipelineTaskSpec";
import type { PipelineRunTaskData } from "./types";

const { mockGetQuery } = vi.hoisted(() => ({ mockGetQuery: vi.fn() }));

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { get: { query: mockGetQuery } } }),
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: unknown) => unknown) => selector({ clusterName: "test-cluster" }),
}));

type Source = Partial<Pick<PipelineRunTaskData, "taskRun" | "taskSpec" | "pendingTaskRef">>;

const pendingRef = { namespace: "krci", name: "build-image" };
const taskSpec = { description: "Builds the image", steps: [{ name: "compile" }] };
const task = { apiVersion: "tekton.dev/v1", kind: "Task", metadata: { name: "build-image" }, spec: taskSpec };

const makeWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

const renderSpec = (source: Source | undefined, queryClient = createTestQueryClient()) => ({
  ...renderHook(() => usePipelineTaskSpec(source), { wrapper: makeWrapper(queryClient) }),
  queryClient,
});

// Lets the effects flush so a "not called" assertion is not merely early.
const settle = () => act(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetQuery.mockResolvedValue(task);
});

describe("usePipelineTaskSpec", () => {
  it("returns the snapshot or inline spec without a request", async () => {
    const { result } = renderSpec({ taskSpec });

    await settle();
    expect(result.current).toEqual({ taskSpec, isLoading: false, isUnavailable: false });
    expect(mockGetQuery).not.toHaveBeenCalled();
  });

  it("reads the referenced Task once for a pending task", async () => {
    const { result } = renderSpec({ pendingTaskRef: pendingRef });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.taskSpec).toEqual(taskSpec));
    expect(result.current.isLoading).toBe(false);
    expect(mockGetQuery).toHaveBeenCalledTimes(1);
    expect(mockGetQuery).toHaveBeenCalledWith({
      clusterName: "test-cluster",
      resourceConfig: k8sTaskConfig,
      namespace: "krci",
      name: "build-image",
    });
  });

  it("shares one request between all readers of the same Task", async () => {
    const queryClient = createTestQueryClient();
    const first = renderSpec({ pendingTaskRef: pendingRef }, queryClient);
    const second = renderSpec({ pendingTaskRef: pendingRef }, queryClient);

    await waitFor(() => expect(first.result.current.taskSpec).toEqual(taskSpec));
    await waitFor(() => expect(second.result.current.taskSpec).toEqual(taskSpec));
    expect(mockGetQuery).toHaveBeenCalledTimes(1);
  });

  it("reports loading without a request while a started TaskRun waits for its snapshot", async () => {
    const taskRun = { metadata: { name: "run-build" }, status: { podName: "pod" } } as TaskRun;
    const { result } = renderSpec({ taskRun });

    await settle();
    expect(result.current).toEqual({ taskSpec: undefined, isLoading: true, isUnavailable: false });
    expect(mockGetQuery).not.toHaveBeenCalled();
  });

  it("settles without a request when there is no task", async () => {
    const { result } = renderSpec(undefined);

    await settle();
    expect(result.current).toEqual({ taskSpec: undefined, isLoading: false, isUnavailable: false });
    expect(mockGetQuery).not.toHaveBeenCalled();
  });

  it("reports an unreadable Task and reads it again on the next mount", async () => {
    mockGetQuery.mockRejectedValueOnce(createK8sNotFoundError('tasks "build-image" not found'));
    const first = renderSpec({ pendingTaskRef: pendingRef });

    await waitFor(() => expect(first.result.current.isUnavailable).toBe(true));
    expect(first.result.current.isLoading).toBe(false);
    first.unmount();

    const second = renderSpec({ pendingTaskRef: pendingRef }, first.queryClient);
    await waitFor(() => expect(second.result.current.taskSpec).toEqual(taskSpec));
    expect(second.result.current.isUnavailable).toBe(false);
    expect(mockGetQuery).toHaveBeenCalledTimes(2);
  });
});

describe("usePrefetchPipelineTaskSpec", () => {
  const renderPrefetch = (queryClient: QueryClient) =>
    renderHook(() => usePrefetchPipelineTaskSpec(), { wrapper: makeWrapper(queryClient) });

  it("starts the read so that a later mount finds the spec in the cache", async () => {
    const queryClient = createTestQueryClient();
    const prefetch = renderPrefetch(queryClient);

    await act(async () => prefetch.result.current({ pendingTaskRef: pendingRef }));
    const { result } = renderSpec({ pendingTaskRef: pendingRef }, queryClient);

    expect(result.current.taskSpec).toEqual(taskSpec);
    expect(mockGetQuery).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a task without a pending ref", async () => {
    const prefetch = renderPrefetch(createTestQueryClient());

    await act(async () => prefetch.result.current({ pendingTaskRef: undefined }));
    expect(mockGetQuery).not.toHaveBeenCalled();
  });

  it("does not repeat a failed read", async () => {
    mockGetQuery.mockRejectedValue(createK8sNotFoundError('tasks "build-image" not found'));
    const queryClient = createTestQueryClient();
    const prefetch = renderPrefetch(queryClient);

    await act(async () => prefetch.result.current({ pendingTaskRef: pendingRef }));
    await act(async () => prefetch.result.current({ pendingTaskRef: pendingRef }));
    expect(mockGetQuery).toHaveBeenCalledTimes(1);
  });
});
