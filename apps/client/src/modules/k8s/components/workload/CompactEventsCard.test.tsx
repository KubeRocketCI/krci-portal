import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase } from "@my-project/shared";

const pollMock = vi.fn();
vi.mock("../../hooks/useK8sResourceListPoll", () => ({
  useK8sResourceListPoll: (...args: unknown[]) => pollMock(...args),
}));

import { CompactEventsCard } from "./CompactEventsCard";
import { EVENTS_POLL_INTERVAL_MS, RESOURCE_EVENTS_FETCH_LIMIT } from "../../constants/event";

const item = {
  apiVersion: "apps/v1",
  kind: "Deployment",
  metadata: { uid: "dep-uid-1", name: "my-dep", namespace: "ns", creationTimestamp: "2024-01-01T00:00:00Z" },
};

describe("CompactEventsCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches with an involvedObject.uid fieldSelector and renders the latest events", () => {
    pollMock.mockReturnValue({
      data: {
        array: [
          { type: "Normal", reason: "ScalingReplicaSet", message: "scaled", involvedObject: { uid: "dep-uid-1" } },
        ],
      },
    });

    render(<CompactEventsCard item={item} />);

    expect(pollMock).toHaveBeenCalledWith(k8sEventConfig, "ns", {
      fieldSelector: "involvedObject.uid=dep-uid-1",
      limit: RESOURCE_EVENTS_FETCH_LIMIT,
      refetchInterval: EVENTS_POLL_INTERVAL_MS,
      enabled: true,
    });
    expect(screen.getByText("ScalingReplicaSet")).toBeInTheDocument();
  });

  it("shows an empty state when there are no events", () => {
    pollMock.mockReturnValue({ data: { array: [] } });
    render(<CompactEventsCard item={item} />);
    expect(screen.getByText("No recent events for this resource.")).toBeInTheDocument();
  });

  it("disables the fetch and shows the empty state for an unidentifiable item (no uid, no name)", () => {
    pollMock.mockReturnValue({ data: { array: [] } });
    // Deliberately malformed (no uid/name) — only reachable via a cast, which is
    // why the runtime `enabled` guard exists rather than relying on the type.
    const unidentified = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { namespace: "ns" },
    } as unknown as KubeObjectBase;
    render(<CompactEventsCard item={unidentified} />);
    expect(pollMock).toHaveBeenCalledWith(
      k8sEventConfig,
      "ns",
      expect.objectContaining({ fieldSelector: undefined, enabled: false })
    );
    expect(screen.getByText("No recent events for this resource.")).toBeInTheDocument();
  });
});
