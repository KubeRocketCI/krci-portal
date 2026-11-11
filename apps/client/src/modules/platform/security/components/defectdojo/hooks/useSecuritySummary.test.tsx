import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/utils";
import { useCodebaseSecuritySummary } from "./useCodebaseSecuritySummary";
import { useEnvironmentSecuritySummary } from "./useEnvironmentSecuritySummary";

const { trpcClient, storeState } = vi.hoisted(() => ({
  trpcClient: {
    security: {
      getCodebaseSummary: { query: vi.fn() },
      getEnvironmentSummary: { query: vi.fn() },
    },
  },
  storeState: { defectDojoWebUrl: "" },
}));

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: () => trpcClient }));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

function renderWithQueryClient<T>(hook: () => T) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}

describe("security summary hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.defectDojoWebUrl = "https://dd.example.com";
  });

  describe("useCodebaseSecuritySummary", () => {
    it("queries the summary of the codebase", async () => {
      const summary = { status: "NONE", codebase: "app", ci: [], runtime: [] };
      trpcClient.security.getCodebaseSummary.query.mockResolvedValue(summary);

      const { result } = renderWithQueryClient(() => useCodebaseSecuritySummary("app"));

      await waitFor(() => expect(result.current.data).toEqual(summary));
      expect(trpcClient.security.getCodebaseSummary.query).toHaveBeenCalledWith({ codebase: "app" });
    });

    it("sends no request when DefectDojo is not configured", () => {
      storeState.defectDojoWebUrl = "";

      renderWithQueryClient(() => useCodebaseSecuritySummary("app"));

      expect(trpcClient.security.getCodebaseSummary.query).not.toHaveBeenCalled();
    });

    it("sends no request without a codebase name", () => {
      renderWithQueryClient(() => useCodebaseSecuritySummary(undefined));

      expect(trpcClient.security.getCodebaseSummary.query).not.toHaveBeenCalled();
    });

    it("does not retry a 403", async () => {
      const forbidden = Object.assign(new Error("forbidden"), { data: { httpStatus: 403 } });
      trpcClient.security.getCodebaseSummary.query.mockRejectedValue(forbidden);

      const { result } = renderWithQueryClient(() => useCodebaseSecuritySummary("app"));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(trpcClient.security.getCodebaseSummary.query).toHaveBeenCalledTimes(1);
    });
  });

  describe("useEnvironmentSecuritySummary", () => {
    it("queries the summary of the environment", async () => {
      const summary = { status: "OK", environment: "demo/dev", applications: [] };
      trpcClient.security.getEnvironmentSummary.query.mockResolvedValue(summary);

      const { result } = renderWithQueryClient(() =>
        useEnvironmentSecuritySummary({ cdPipeline: "demo", stage: "dev" })
      );

      await waitFor(() => expect(result.current.data).toEqual(summary));
      expect(trpcClient.security.getEnvironmentSummary.query).toHaveBeenCalledWith({
        cdPipeline: "demo",
        stage: "dev",
      });
    });

    it("sends no request when DefectDojo is not configured", () => {
      storeState.defectDojoWebUrl = "";

      renderWithQueryClient(() => useEnvironmentSecuritySummary({ cdPipeline: "demo", stage: "dev" }));

      expect(trpcClient.security.getEnvironmentSummary.query).not.toHaveBeenCalled();
    });

    it("sends no request before the Stage is loaded", () => {
      renderWithQueryClient(() => useEnvironmentSecuritySummary({ cdPipeline: undefined, stage: undefined }));

      expect(trpcClient.security.getEnvironmentSummary.query).not.toHaveBeenCalled();
    });
  });
});
