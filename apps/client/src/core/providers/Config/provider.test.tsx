import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "./provider";
import { createTestQueryClient } from "@/test/utils";
import React from "react";

const {
  mockTrpcClient,
  mockSetClusterName,
  mockSetDefaultNamespace,
  mockSetAllowedNamespaces,
  mockSetSonarWebUrl,
  mockSetDependencyTrackWebUrl,
  mockClusterStore,
} = vi.hoisted(() => {
  const mockSetClusterName = vi.fn();
  const mockSetDefaultNamespace = vi.fn();
  const mockSetAllowedNamespaces = vi.fn();
  const mockSetSonarWebUrl = vi.fn();
  const mockSetDependencyTrackWebUrl = vi.fn();
  const mockClusterStore = {
    clusterName: null as string | null,
    clusterNameResolved: true,
    setClusterName: mockSetClusterName,
    setDefaultNamespace: mockSetDefaultNamespace,
    setAllowedNamespaces: mockSetAllowedNamespaces,
    setSonarWebUrl: mockSetSonarWebUrl,
    setDependencyTrackWebUrl: mockSetDependencyTrackWebUrl,
  };
  const mockTrpcClient = {
    config: {
      get: {
        query: vi.fn(),
      },
    },
  };
  return {
    mockTrpcClient,
    mockSetClusterName,
    mockSetDefaultNamespace,
    mockSetAllowedNamespaces,
    mockSetSonarWebUrl,
    mockSetDependencyTrackWebUrl,
    mockClusterStore,
  };
});

vi.mock("@/core/providers/trpc/http-client", () => ({
  trpcHttpClient: mockTrpcClient,
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: Object.assign(
    vi.fn((selector) => {
      if (selector) {
        return selector(mockClusterStore);
      }
      return mockClusterStore;
    }),
    {
      setState: vi.fn(),
      getState: vi.fn(() => mockClusterStore),
    }
  ),
}));

vi.mock("@/core/components/ui/LoadingProgressBar", () => ({
  LoadingProgressBar: () => <div data-testid="loading-progress-bar">Loading...</div>,
}));

vi.mock("@/core/components/CriticalError", () => ({
  CriticalError: ({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) => (
    <div data-testid="critical-error">
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement, options?: { queryClient?: QueryClient }) => {
  const queryClient = options?.queryClient || createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("ConfigProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClusterStore.clusterName = null;
    mockClusterStore.clusterNameResolved = true;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading States", () => {
    it("should show loading progress bar while config is loading", () => {
      mockTrpcClient.config.get.query.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(
        <ConfigProvider>
          <div data-testid="children">content</div>
        </ConfigProvider>
      );

      expect(screen.getByTestId("loading-progress-bar")).toBeInTheDocument();
      expect(screen.queryByTestId("children")).not.toBeInTheDocument();
    });

    it("should render children once config is loaded", async () => {
      mockTrpcClient.config.get.query.mockResolvedValue({
        clusterName: "test-cluster",
        defaultNamespace: "default",
        sonarWebUrl: "https://sonar.example.com",
        dependencyTrackWebUrl: "https://dependency-track.example.com",
      });

      renderWithProviders(
        <ConfigProvider>
          <div data-testid="children">content</div>
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("children")).toBeInTheDocument();
      });
    });
  });

  describe("Cluster store initialization", () => {
    it("should initialize cluster store when config is loaded", async () => {
      const mockConfig = {
        clusterName: "test-cluster",
        defaultNamespace: "default",
        sonarWebUrl: "https://sonar.example.com",
        dependencyTrackWebUrl: "https://dependency-track.example.com",
      };

      mockTrpcClient.config.get.query.mockResolvedValue(mockConfig);

      renderWithProviders(
        <ConfigProvider>
          <div />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(mockSetClusterName).toHaveBeenCalledWith("test-cluster");
        expect(mockSetDefaultNamespace).toHaveBeenCalledWith("default");
        expect(mockSetAllowedNamespaces).toHaveBeenCalledWith(["default"]);
        expect(mockSetSonarWebUrl).toHaveBeenCalledWith("https://sonar.example.com");
        expect(mockSetDependencyTrackWebUrl).toHaveBeenCalledWith("https://dependency-track.example.com");
      });
    });

    it("should not override existing cluster name in store", async () => {
      mockClusterStore.clusterName = "existing-cluster";

      mockTrpcClient.config.get.query.mockResolvedValue({
        clusterName: "test-cluster",
        defaultNamespace: "default",
        sonarWebUrl: "https://sonar.example.com",
        dependencyTrackWebUrl: "https://dependency-track.example.com",
      });

      renderWithProviders(
        <ConfigProvider>
          <div />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(mockSetClusterName).not.toHaveBeenCalled();
      });
    });

    it("should preserve custom namespace settings from localStorage", async () => {
      const customSettings = {
        "test-cluster": {
          defaultNamespace: "custom-namespace",
          allowedNamespaces: ["custom-namespace", "other"],
        },
      };
      localStorage.setItem("cluster_settings", JSON.stringify(customSettings));

      mockTrpcClient.config.get.query.mockResolvedValue({
        clusterName: "test-cluster",
        defaultNamespace: "default",
        sonarWebUrl: "https://sonar.example.com",
        dependencyTrackWebUrl: "https://dependency-track.example.com",
      });

      renderWithProviders(
        <ConfigProvider>
          <div />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(mockSetDefaultNamespace).not.toHaveBeenCalled();
        expect(mockSetAllowedNamespaces).not.toHaveBeenCalled();
      });
    });

    it("should always update security tool URLs from server config", async () => {
      mockClusterStore.clusterName = "existing-cluster";

      mockTrpcClient.config.get.query.mockResolvedValue({
        clusterName: "existing-cluster",
        defaultNamespace: "default",
        sonarWebUrl: "https://sonar.example.com",
        dependencyTrackWebUrl: "https://dependency-track.example.com",
      });

      renderWithProviders(
        <ConfigProvider>
          <div />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(mockSetSonarWebUrl).toHaveBeenCalledWith("https://sonar.example.com");
        expect(mockSetDependencyTrackWebUrl).toHaveBeenCalledWith("https://dependency-track.example.com");
      });
    });
  });

  describe("Error States", () => {
    it("should show critical error when config query fails", async () => {
      const mockError = new Error("Config fetch failed");
      mockTrpcClient.config.get.query.mockImplementation(() => Promise.reject(mockError));

      renderWithProviders(
        <ConfigProvider>
          <div data-testid="children">content</div>
        </ConfigProvider>
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("critical-error")).toBeInTheDocument();
          expect(screen.getByText("Configuration Error")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.queryByTestId("children")).not.toBeInTheDocument();
    });

    it("should retry config query when retry button is clicked", async () => {
      const mockError = new Error("Config fetch failed");
      mockTrpcClient.config.get.query.mockImplementation(() => Promise.reject(mockError));

      renderWithProviders(
        <ConfigProvider>
          <div />
        </ConfigProvider>
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("critical-error")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const initialCallCount = mockTrpcClient.config.get.query.mock.calls.length;
      screen.getByText("Retry").click();

      await waitFor(
        () => {
          expect(mockTrpcClient.config.get.query.mock.calls.length).toBeGreaterThan(initialCallCount);
        },
        { timeout: 5000 }
      );
    });
  });
});
