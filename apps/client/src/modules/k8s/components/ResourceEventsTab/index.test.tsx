import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase } from "@my-project/shared";

const pollMock = vi.fn();
vi.mock("../../hooks/useK8sResourceListPoll", () => ({
  useK8sResourceListPoll: (...args: unknown[]) => pollMock(...args),
}));

import { ResourceEventsTab } from "./index";
import { EVENTS_POLL_INTERVAL_MS, RESOURCE_EVENTS_FETCH_LIMIT } from "../../constants/event";

const item = {
  apiVersion: "v1",
  kind: "Pod",
  metadata: { uid: "pod-uid-1", name: "my-pod", namespace: "ns", creationTimestamp: "2024-01-01T00:00:00Z" },
};

describe("ResourceEventsTab", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches with an involvedObject.uid fieldSelector and renders matching events", () => {
    pollMock.mockReturnValue({
      data: {
        array: [{ type: "Warning", reason: "BackOff", message: "boom", involvedObject: { uid: "pod-uid-1" } }],
      },
    });

    render(<ResourceEventsTab item={item} />);

    expect(pollMock).toHaveBeenCalledWith(k8sEventConfig, "ns", {
      fieldSelector: "involvedObject.uid=pod-uid-1",
      limit: RESOURCE_EVENTS_FETCH_LIMIT,
      refetchInterval: EVENTS_POLL_INTERVAL_MS,
      enabled: true,
    });
    expect(screen.getByText("BackOff")).toBeInTheDocument();
  });

  it("shows an empty state when there are no events", () => {
    pollMock.mockReturnValue({ data: { array: [] } });
    render(<ResourceEventsTab item={item} />);
    expect(screen.getByText("No events for this resource.")).toBeInTheDocument();
  });

  it("disables the fetch and shows the empty state for an unidentifiable item (no uid, no name)", () => {
    pollMock.mockReturnValue({ data: { array: [] } });
    // Deliberately malformed (no uid/name) — only reachable via a cast, which is
    // why the runtime `enabled` guard exists rather than relying on the type.
    const unidentified = { apiVersion: "v1", kind: "Pod", metadata: { namespace: "ns" } } as unknown as KubeObjectBase;
    render(<ResourceEventsTab item={unidentified} />);
    expect(pollMock).toHaveBeenCalledWith(
      k8sEventConfig,
      "ns",
      expect.objectContaining({ fieldSelector: undefined, enabled: false })
    );
    expect(screen.getByText("No events for this resource.")).toBeInTheDocument();
  });
});
