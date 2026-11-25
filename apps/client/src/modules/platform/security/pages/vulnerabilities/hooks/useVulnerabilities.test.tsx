import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { Vulnerabilities, VulnerabilitiesInput } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { useVulnerabilities, vulnerabilitiesKey } from "./useVulnerabilities";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const INPUT: VulnerabilitiesInput = {
  level: "runtime",
  namespace: "krci",
  clusters: ["in-cluster"],
  workloadNamespace: "demo-dev",
  state: "falsePositive",
  severity: "Critical",
  page: 0,
  pageSize: 25,
};

const DATA: Vulnerabilities = { state: "data", total: 0, findings: [], clusters: ["in-cluster"], truncated: false };

/** The query client of the app: it does not refetch on mount unless a hook asks for it. */
function renderVulnerabilities(input: VulnerabilitiesInput = INPUT) {
  return renderHook(({ current }) => useVulnerabilities(current), {
    initialProps: { current: input },
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useVulnerabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getVulnerabilities: { query } } } as never);
  });

  it("asks the server with the typed filters and the page: no tag and no DefectDojo id", async () => {
    query.mockResolvedValue(DATA);

    const { result } = renderVulnerabilities();
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledWith(INPUT);
  });

  it("keeps the page on screen, marked as a placeholder, while the next page or filter of its level loads", async () => {
    const firstPage: Vulnerabilities = { ...DATA, total: 40 };
    query.mockResolvedValueOnce(firstPage).mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderVulnerabilities();
    await waitFor(() => expect(result.current.data).toEqual(firstPage));
    rerender({ current: { ...INPUT, page: 1 } });

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toEqual(firstPage);
    expect(result.current.isPlaceholderData).toBe(true);
  });

  it("keeps no row of the previous level while another level loads: its columns differ", async () => {
    query.mockResolvedValueOnce({ ...DATA, total: 40 }).mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderVulnerabilities();
    await waitFor(() => expect(result.current.data).toEqual({ ...DATA, total: 40 }));
    rerender({ current: { level: "code", namespace: "krci" } });

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("asks again on the next visit when the kept result says DefectDojo is unreachable", async () => {
    queryClient.setQueryData(vulnerabilitiesKey(INPUT), { state: "unreachable" });
    query.mockResolvedValue(DATA);

    const { result } = renderVulnerabilities();
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledTimes(1);
  });

  it("asks nothing until the installation namespace is known", () => {
    const { result } = renderVulnerabilities({ ...INPUT, namespace: "" });

    expect(result.current.fetchStatus).toBe("idle");
    expect(query).not.toHaveBeenCalled();
  });
});
