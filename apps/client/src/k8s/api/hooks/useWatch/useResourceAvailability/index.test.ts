import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { K8sResourceConfig } from "@my-project/shared";

const discoveryQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: QueryOptions) => {
    lastQueryOptions = options;
    return queryResult;
  },
}));

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { discoveryDocument: { query: discoveryQuery } } }),
}));

vi.mock("@/core/auth/provider", () => ({ useAuth: () => ({ isAuthenticated }) }));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: { clusterName: string }) => unknown) => selector({ clusterName: "kind-krci" }),
}));

type QueryOptions = { enabled?: boolean; staleTime?: number; refetchInterval?: number };

let lastQueryOptions: QueryOptions = {};
let queryResult: { data?: unknown; isError: boolean } = { isError: false };
let isAuthenticated = true;

import { useAvailabilityGate, useResourceAvailability } from "./index";

const optionalType: K8sResourceConfig = {
  apiVersion: "capsule.clastix.io/v1beta2",
  group: "capsule.clastix.io",
  version: "v1beta2",
  kind: "Tenant",
  singularName: "tenant",
  pluralName: "tenants",
  clusterScoped: true,
  mayBeAbsent: true,
};

const requiredType: K8sResourceConfig = {
  apiVersion: "v1",
  group: "",
  version: "v1",
  kind: "Pod",
  singularName: "pod",
  pluralName: "pods",
};

const render = (config: K8sResourceConfig, enabled = true) =>
  renderHook(() => useResourceAvailability(config, enabled)).result.current;

const renderGate = (config: K8sResourceConfig, callerEnabled = true) =>
  renderHook(() => useAvailabilityGate(config, callerEnabled)).result.current;

beforeEach(() => {
  lastQueryOptions = {};
  queryResult = { isError: false };
  isAuthenticated = true;
  discoveryQuery.mockReset();
});

describe("useResourceAvailability", () => {
  it("reports served without a request for a type that cannot be absent", () => {
    expect(render(requiredType)).toBe("served");
    expect(lastQueryOptions.enabled).toBe(false);
  });

  it("does not discover when the caller's own gate is closed", () => {
    expect(render(optionalType, false)).toBe("served");
    expect(lastQueryOptions.enabled).toBe(false);
  });

  it("does not discover before authentication", () => {
    isAuthenticated = false;

    expect(render(optionalType)).toBe("served");
    expect(lastQueryOptions.enabled).toBe(false);
  });

  it("reports pending while discovery is in flight", () => {
    expect(render(optionalType)).toBe("pending");
    expect(lastQueryOptions.enabled).toBe(true);
  });

  it("reports served when the document lists the plural", () => {
    queryResult = { data: { status: "served", plurals: ["tenants", "capsuleconfigurations"] }, isError: false };

    expect(render(optionalType)).toBe("served");
  });

  it("reports not-served when the document omits the plural", () => {
    queryResult = { data: { status: "served", plurals: ["capsuleconfigurations"] }, isError: false };

    expect(render(optionalType)).toBe("not-served");
  });

  it("reports not-served when the whole group is absent", () => {
    queryResult = { data: { status: "not-served", plurals: [] }, isError: false };

    expect(render(optionalType)).toBe("not-served");
  });

  it("reports unknown when discovery fails, so callers fail open", () => {
    queryResult = { isError: true };

    expect(render(optionalType)).toBe("unknown");
  });

  // staleTime alone schedules nothing; an always-mounted consumer (the Header) would
  // otherwise never see an add-on installed mid-session.
  it("re-reads the document on an interval while mounted", () => {
    render(optionalType);

    expect(lastQueryOptions.refetchInterval).toBe(10 * 60 * 1000);
    expect(lastQueryOptions.staleTime).toBe(lastQueryOptions.refetchInterval);
  });
});

describe("useAvailabilityGate", () => {
  it("opens for a type that cannot be absent", () => {
    expect(renderGate(requiredType)).toEqual({ availability: "served", notServed: false, isEnabled: true });
  });

  it("stays closed while discovery is pending", () => {
    expect(renderGate(optionalType)).toEqual({ availability: "pending", notServed: false, isEnabled: false });
  });

  it("closes and settles for a type the cluster does not serve", () => {
    queryResult = { data: { status: "not-served", plurals: [] }, isError: false };

    expect(renderGate(optionalType)).toEqual({ availability: "not-served", notServed: true, isEnabled: false });
  });

  it("fails open when discovery could not answer", () => {
    queryResult = { isError: true };

    expect(renderGate(optionalType)).toEqual({ availability: "unknown", notServed: false, isEnabled: true });
  });

  it("stays closed when the caller's own gate is closed", () => {
    queryResult = { data: { status: "served", plurals: ["tenants"] }, isError: false };

    expect(renderGate(optionalType, false)).toEqual({ availability: "served", notServed: false, isEnabled: false });
  });
});
