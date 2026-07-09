import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AUDIT_EVENTS_DEFAULT_PER_PAGE, useAuditEvents } from "./useAuditEvents";
import { defaultAuditEventFilterValues } from "../components/AuditEventFilter/constants";
import type { KrciAuditEventsResponse } from "@my-project/shared";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    krciAudit: {
      getAuditEvents: { query: mockQuery },
    },
  }),
}));

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe("useAuditEvents", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("requests with default filters mapped to undefined (no server-side over-filtering)", async () => {
    const response: KrciAuditEventsResponse = { data: [], pagination: { total: 0, page: 1, perPage: 20 } };
    mockQuery.mockResolvedValue(response);

    const { Wrapper } = makeWrapper();
    renderHook(() => useAuditEvents(defaultAuditEventFilterValues), { wrapper: Wrapper });

    await waitFor(() => expect(mockQuery).toHaveBeenCalled());
    expect(mockQuery).toHaveBeenCalledWith({
      kind: undefined,
      namespace: undefined,
      operation: undefined,
      actor: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      perPage: AUDIT_EVENTS_DEFAULT_PER_PAGE,
    });
  });

  it("passes the requested page and page size straight through to krci-audit (server-side paging)", async () => {
    mockQuery.mockResolvedValue({ data: [], pagination: { total: 250, page: 3, perPage: 50 } });

    const { Wrapper } = makeWrapper();
    renderHook(() => useAuditEvents(defaultAuditEventFilterValues, 3, 50), { wrapper: Wrapper });

    await waitFor(() => expect(mockQuery).toHaveBeenCalled());
    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ page: 3, perPage: 50 }));
  });

  it("passes non-empty filter values through, mapping the 'all' operation sentinel to undefined", async () => {
    mockQuery.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, perPage: 100 } });

    const { Wrapper } = makeWrapper();
    renderHook(
      () =>
        useAuditEvents({
          kind: "PipelineRun",
          namespace: "krci",
          operation: "CREATE",
          actor: "kubernetes-admin",
          from: "2026-07-01T00:00:00Z",
          to: "2026-07-08T00:00:00Z",
        }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(mockQuery).toHaveBeenCalled());
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "PipelineRun",
        namespace: "krci",
        operation: "CREATE",
        actor: "kubernetes-admin",
        from: "2026-07-01T00:00:00Z",
        to: "2026-07-08T00:00:00Z",
      })
    );
  });

  it("exposes the parsed events and total from the response", async () => {
    const response: KrciAuditEventsResponse = {
      data: [
        {
          eventUid: "event-1",
          receivedAt: "2026-07-08T00:00:00Z",
          operation: "CREATE",
          apiGroup: "tekton.dev",
          apiVersion: "v1",
          resource: "pipelineruns",
          kind: "PipelineRun",
          namespace: "krci",
          name: "run-1",
          username: "kubernetes-admin",
          dryRun: false,
        },
      ],
      pagination: { total: 1, page: 1, perPage: 100 },
    };
    mockQuery.mockResolvedValue(response);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuditEvents(defaultAuditEventFilterValues), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.events).toHaveLength(1));
    expect(result.current.total).toBe(1);
  });
});
