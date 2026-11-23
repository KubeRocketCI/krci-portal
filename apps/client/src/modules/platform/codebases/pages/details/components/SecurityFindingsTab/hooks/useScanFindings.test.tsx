import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ScanFindings, ScanFindingsInput } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { scanFindingsKey, useScanFindings } from "./useScanFindings";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const INPUT: ScanFindingsInput = {
  namespace: "krci",
  name: "test-go-app",
  scan: { level: "image", branch: "main", scanner: "Trivy Scan", image: "registry.example.test/krci/test-go-app" },
  severity: "Critical",
  showTriaged: true,
  page: 1,
  pageSize: 25,
};

const DATA: ScanFindings = { state: "data", total: 0, findings: [] };

/** The query client of the app: it does not refetch on mount unless a hook asks for it. */
function renderFindings(input = INPUT) {
  return renderHook(({ current }) => useScanFindings(current), {
    initialProps: { current: input },
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

describe("useScanFindings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getScanFindings: { query } } } as never);
  });

  it("asks the server for the scan by its typed identity, with the filter and the page: no tag and no DefectDojo id", async () => {
    query.mockResolvedValue(DATA);

    const { result } = renderFindings();
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledWith({
      namespace: "krci",
      name: "test-go-app",
      scan: { level: "image", branch: "main", scanner: "Trivy Scan", image: "registry.example.test/krci/test-go-app" },
      severity: "Critical",
      showTriaged: true,
      page: 1,
      pageSize: 25,
    });
  });

  it("keeps the page on screen while the next page, size or filter loads", async () => {
    const firstPage: ScanFindings = { state: "data", total: 12, findings: [] };
    query.mockResolvedValueOnce(firstPage).mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderFindings();
    await waitFor(() => expect(result.current.data).toEqual(firstPage));
    rerender({ current: { ...INPUT, page: 2 } });

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toEqual(firstPage);
  });

  it("keeps a page with data for five minutes: opening the row again asks nothing", async () => {
    query.mockResolvedValue(DATA);

    const first = renderFindings();
    await waitFor(() => expect(first.result.current.data).toEqual(DATA));
    first.unmount();
    const second = renderFindings();

    expect(second.result.current.data).toEqual(DATA);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([{ state: "unreachable" }, { state: "notConfigured" }, { state: "noScanData" }] as const)(
    "asks again when the row opens and the kept result is %o",
    async (answer) => {
      queryClient.setQueryData(scanFindingsKey(INPUT), answer);
      query.mockResolvedValue(DATA);

      const { result } = renderFindings();
      await waitFor(() => expect(result.current.data).toEqual(DATA));

      expect(query).toHaveBeenCalledTimes(1);
    }
  );
});
