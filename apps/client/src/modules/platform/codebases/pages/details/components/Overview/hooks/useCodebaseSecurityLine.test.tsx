import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { CodebaseSecurityLine } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { codebaseSecurityLineKey, useCodebaseSecurityLine } from "./useCodebaseSecurityLine";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const INPUT = { namespace: "krci", name: "test-go-app" };

const DATA: CodebaseSecurityLine = {
  state: "data",
  levels: { code: { state: "clean" }, image: { state: "noScanData" }, runtime: { state: "notRunning" } },
};

/** The query client of the app: it does not refetch on mount unless a hook asks for it. */
function renderLine() {
  return renderHook(() => useCodebaseSecurityLine(INPUT), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

describe("useCodebaseSecurityLine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getCodebaseSecurityLine: { query } } } as never);
  });

  it("asks the server once, for the codebase only: no tag and no DefectDojo id", async () => {
    query.mockResolvedValue(DATA);

    const { result } = renderLine();
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith({ namespace: "krci", name: "test-go-app" });
  });

  it("keeps a line with data: opening the Overview tab again asks nothing", async () => {
    query.mockResolvedValue(DATA);

    const first = renderLine();
    await waitFor(() => expect(first.result.current.data).toEqual(DATA));
    first.unmount();
    const second = renderLine();

    expect(second.result.current.data).toEqual(DATA);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([{ state: "unreachable" }, { state: "notConfigured" }] as const)(
    "asks again on the next visit when the kept line is %o, so a retry after an outage needs no reload",
    async (answer) => {
      queryClient.setQueryData(codebaseSecurityLineKey(INPUT), answer);
      query.mockResolvedValue(DATA);

      const { result } = renderLine();
      await waitFor(() => expect(result.current.data).toEqual(DATA));

      expect(query).toHaveBeenCalledTimes(1);
    }
  );
});
