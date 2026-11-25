import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { FindingsScope } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { useFindingsScope } from "./useFindingsScope";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const SCOPE: FindingsScope = { state: "data", stageClusters: ["in-cluster"], clusters: ["in-cluster"], namespaces: [] };

function renderScope(namespace: string) {
  return renderHook(() => useFindingsScope({ namespace }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useFindingsScope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getFindingsScope: { query } } } as never);
  });

  it("asks the server for the filter options of the installation namespace", async () => {
    query.mockResolvedValue(SCOPE);

    const { result } = renderScope("krci");
    await waitFor(() => expect(result.current.data).toEqual(SCOPE));

    expect(query).toHaveBeenCalledWith({ namespace: "krci" });
  });

  it("asks nothing until the installation namespace is known", () => {
    const { result } = renderScope("");

    expect(result.current.fetchStatus).toBe("idle");
    expect(query).not.toHaveBeenCalled();
  });
});
