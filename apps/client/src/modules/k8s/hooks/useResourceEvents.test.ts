import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase } from "@my-project/shared";

const pollMock = vi.fn();
vi.mock("./useK8sResourceListPoll", () => ({
  useK8sResourceListPoll: (...args: unknown[]) => pollMock(...args),
}));

import { useResourceEvents } from "./useResourceEvents";
import { EVENTS_POLL_INTERVAL_MS, RESOURCE_EVENTS_FETCH_LIMIT } from "../constants/event";

describe("useResourceEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pollMock.mockReturnValue({ data: { array: [] } });
  });

  it("scopes by involvedObject.uid and forwards limit/poll-interval with the fetch enabled", () => {
    const item: KubeObjectBase = {
      apiVersion: "v1",
      kind: "Pod",
      metadata: { uid: "pod-uid-1", name: "my-pod", namespace: "ns", creationTimestamp: "2024-01-01T00:00:00Z" },
    };

    renderHook(() => useResourceEvents(item));

    expect(pollMock).toHaveBeenCalledWith(k8sEventConfig, "ns", {
      fieldSelector: "involvedObject.uid=pod-uid-1",
      limit: RESOURCE_EVENTS_FETCH_LIMIT,
      refetchInterval: EVENTS_POLL_INTERVAL_MS,
      enabled: true,
    });
  });

  it("falls back to a kind+name+namespace selector when the item has no uid", () => {
    const item = {
      apiVersion: "v1",
      kind: "Pod",
      metadata: { name: "my-pod", namespace: "ns" },
    } as unknown as KubeObjectBase;

    renderHook(() => useResourceEvents(item));

    expect(pollMock).toHaveBeenCalledWith(
      k8sEventConfig,
      "ns",
      expect.objectContaining({
        fieldSelector: "involvedObject.kind=Pod,involvedObject.name=my-pod,involvedObject.namespace=ns",
        enabled: true,
      })
    );
  });

  it("disables the fetch when the item carries nothing identifying (no uid, no name)", () => {
    // Deliberately malformed — only reachable via a cast, which is why the
    // runtime `enabled` guard exists rather than relying on the type.
    const item = { apiVersion: "v1", kind: "Pod", metadata: { namespace: "ns" } } as unknown as KubeObjectBase;

    renderHook(() => useResourceEvents(item));

    expect(pollMock).toHaveBeenCalledWith(
      k8sEventConfig,
      "ns",
      expect.objectContaining({ fieldSelector: undefined, enabled: false })
    );
  });

  it("defaults the namespace to an empty string when the item has none", () => {
    const item = { apiVersion: "v1", kind: "Pod", metadata: { uid: "u1" } } as unknown as KubeObjectBase;

    renderHook(() => useResourceEvents(item));

    expect(pollMock).toHaveBeenCalledWith(k8sEventConfig, "", expect.objectContaining({ enabled: true }));
  });

  it("returns the underlying poll result unchanged", () => {
    const pollResult = { data: { array: [{ reason: "Started" }] } };
    pollMock.mockReturnValue(pollResult);

    const item = { apiVersion: "v1", kind: "Pod", metadata: { uid: "u1", namespace: "ns" } } as KubeObjectBase;
    const { result } = renderHook(() => useResourceEvents(item));

    expect(result.current).toBe(pollResult);
  });
});
