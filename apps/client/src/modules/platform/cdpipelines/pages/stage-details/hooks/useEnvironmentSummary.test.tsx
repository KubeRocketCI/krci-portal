import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { EnvironmentSummary } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { environmentSummaryKey, useEnvironmentSummary } from "./useEnvironmentSummary";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const INPUT = { namespace: "krci", cdPipeline: "demo", stage: "dev" };

const DATA: EnvironmentSummary = {
  state: "data",
  place: { cluster: "in-cluster", namespace: "krci-demo-dev" },
  runtime: { state: "notRunning", url: "https://defectdojo.example.test/asset/4" },
  containers: { scanned: 0, withoutCodebase: 0, notRunning: 1 },
  applications: [],
};

/** Renders the hook on the app's own query client, whose default is no refetch on mount. */
function renderSummary() {
  return renderHook(() => useEnvironmentSummary(INPUT), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

describe("useEnvironmentSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getEnvironmentSummary: { query } } } as never);
  });

  it("asks the server for the Stage only: no tag and no DefectDojo id", async () => {
    query.mockResolvedValue(DATA);

    const { result } = renderSummary();
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith({ namespace: "krci", cdPipeline: "demo", stage: "dev" });
  });

  it("serves the other tab of the Stage page from a result with data: it asks nothing", async () => {
    query.mockResolvedValue(DATA);

    const applications = renderSummary();
    await waitFor(() => expect(applications.result.current.data).toEqual(DATA));
    applications.unmount();
    const overview = renderSummary();

    expect(overview.result.current.data).toEqual(DATA);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([{ state: "unreachable" }, { state: "notConfigured" }, { state: "noScanData" }] as const)(
    "asks again when the other tab opens after %o, so a retry after an outage needs no reload",
    async (answer) => {
      queryClient.setQueryData(environmentSummaryKey(INPUT), answer);
      query.mockResolvedValue(DATA);

      const { result } = renderSummary();
      await waitFor(() => expect(result.current.data).toEqual(DATA));

      expect(query).toHaveBeenCalledTimes(1);
    }
  );
});
