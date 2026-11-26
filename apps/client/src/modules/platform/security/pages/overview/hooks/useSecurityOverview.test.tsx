import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { SecurityOverview, SecurityOverviewCodebases } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { useSecurityOverview } from "./useSecurityOverview";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const runtimeQuery = vi.fn();
const codebasesQuery = vi.fn();

const RUNTIME: SecurityOverview = { state: "noScanData" };
const CODEBASES: SecurityOverviewCodebases = { state: "noScanData", unscanned: ["demo-app"] };

function renderOverview(input: Parameters<typeof useSecurityOverview>[0]) {
  return renderHook(() => useSecurityOverview(input), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useSecurityOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    runtimeQuery.mockResolvedValue(RUNTIME);
    codebasesQuery.mockResolvedValue(CODEBASES);
    vi.mocked(useTRPCClient).mockReturnValue({
      defectDojo: {
        getSecurityOverview: { query: runtimeQuery },
        getSecurityOverviewCodebases: { query: codebasesQuery },
      },
    } as never);
  });

  it("asks for both parts at once, with the namespace and the state", async () => {
    const { result } = renderOverview({ namespace: "krci", state: "falsePositive" });

    await waitFor(() => expect(result.current.codebases.data).toEqual(CODEBASES));
    await waitFor(() => expect(result.current.runtime?.data).toEqual(RUNTIME));
    expect(runtimeQuery).toHaveBeenCalledWith({ namespace: "krci", state: "falsePositive" });
    expect(codebasesQuery).toHaveBeenCalledWith({ namespace: "krci", state: "falsePositive" });
  });

  it("asks only for the Codebases part under Mitigated, and has no Runtime part: Runtime has no such state", async () => {
    const { result } = renderOverview({ namespace: "krci", state: "mitigated" });

    await waitFor(() => expect(result.current.codebases.data).toEqual(CODEBASES));
    expect(runtimeQuery).not.toHaveBeenCalled();
    expect(result.current.runtime).toBeNull();
  });

  it("asks nothing before the installation namespace is known", () => {
    renderOverview({ namespace: "", state: "active" });

    expect(runtimeQuery).not.toHaveBeenCalled();
    expect(codebasesQuery).not.toHaveBeenCalled();
  });
});
