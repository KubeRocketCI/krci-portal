import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { CodebaseFindings } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { codebaseFindingsKey, useCodebaseFindings } from "./useCodebaseFindings";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const INPUT = { namespace: "krci", name: "test-go-app" };

const DATA: CodebaseFindings = {
  state: "data",
  levels: {
    code: { state: "noScanData", scans: [], lastUpload: null },
    image: { state: "noScanData", scans: [], lastUpload: null },
    runtime: { state: "noScanData", environments: [], lastUpload: null },
  },
};

/** The query client of the app: it does not refetch on mount unless a hook asks for it. */
function renderFindings() {
  return renderHook(() => useCodebaseFindings(INPUT), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

describe("useCodebaseFindings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getCodebaseFindings: { query } } } as never);
  });

  it("asks the server for the codebase only: no tag and no DefectDojo id", async () => {
    query.mockResolvedValue(DATA);

    const { result } = renderFindings();
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith({ namespace: "krci", name: "test-go-app" });
  });

  it("keeps a result with data: a second tab visit asks nothing", async () => {
    query.mockResolvedValue(DATA);

    const first = renderFindings();
    await waitFor(() => expect(first.result.current.data).toEqual(DATA));
    first.unmount();
    const second = renderFindings();

    expect(second.result.current.data).toEqual(DATA);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([{ state: "unreachable" }, { state: "notConfigured" }] as const)(
    "asks again on the next visit when the kept result is %o, so a retry after an outage needs no reload",
    async (answer) => {
      queryClient.setQueryData(codebaseFindingsKey(INPUT), answer);
      query.mockResolvedValue(DATA);

      const { result } = renderFindings();
      await waitFor(() => expect(result.current.data).toEqual(DATA));

      expect(query).toHaveBeenCalledTimes(1);
    }
  );
});
