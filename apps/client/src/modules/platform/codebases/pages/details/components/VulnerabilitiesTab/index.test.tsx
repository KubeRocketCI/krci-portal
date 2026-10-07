import React from "react";
import { act, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTRPCClient } from "@/core/providers/trpc";
import { createTestQueryClient } from "@/test/utils";
import { renderInActivity } from "@/test/utils/activity";
import { VulnerabilitiesTab } from "./index";
import type { VulnerabilitiesTabContentProps, VulnerabilitiesTabProps } from "./types";

const chunk = vi.hoisted(() => {
  let resolve!: () => void;
  let loads = 0;
  const promise = new Promise<{
    VulnerabilitiesTabContent: (p: VulnerabilitiesTabContentProps) => React.ReactElement;
  }>((res) => {
    resolve = () =>
      res({
        VulnerabilitiesTabContent: (p) => (
          <span>
            content:{p.namespace}:{p.isLoading ? "loading" : (p.project?.uuid ?? "none")}
          </span>
        ),
      });
  });
  return {
    promise,
    resolve,
    load: () => {
      loads += 1;
      return promise;
    },
    loads: () => loads,
  };
});

vi.mock("./VulnerabilitiesTabContent", () => chunk.load());

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: vi.fn(),
}));

const getProjectByNameAndVersion = vi.fn();
const getProjectMetrics = vi.fn();

const props: VulnerabilitiesTabProps = {
  codebaseName: "app",
  defaultBranch: "main",
  namespace: "ns",
  clusterName: "cluster",
};

const renderTab = () => {
  const queryClient = createTestQueryClient();
  return renderInActivity(() => <VulnerabilitiesTab {...props} />, {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
};

const anchor = (container: HTMLElement) => container.querySelector('[data-tour="dependencies-widget"]');

// The mocked chunk is one module-level promise: only the first test observes the pending state.
describe("VulnerabilitiesTab", () => {
  beforeEach(() => {
    getProjectByNameAndVersion.mockReset().mockResolvedValue({ uuid: "p-1" });
    getProjectMetrics.mockReset().mockResolvedValue([]);
    vi.mocked(useTRPCClient).mockReturnValue({
      dependencyTrack: {
        getProjectByNameAndVersion: { query: getProjectByNameAndVersion },
        getProjectMetrics: { query: getProjectMetrics },
      },
    } as unknown as ReturnType<typeof useTRPCClient>);
  });

  it("requests the project and its metrics while the chunk is pending, and shows the content on re-show after it resolved while hidden", async () => {
    const { container, setMode } = renderTab();

    expect(anchor(container)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(getProjectByNameAndVersion).toHaveBeenCalledWith({ projectName: "app", defaultBranch: "main" });
    await waitFor(() => expect(getProjectMetrics).toHaveBeenCalledWith({ uuid: "p-1", days: 90 }));
    expect(screen.queryByText(/^content:/)).not.toBeInTheDocument();

    setMode("hidden");
    await act(async () => chunk.resolve());
    setMode("visible");

    expect(await screen.findByText("content:ns:p-1")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(anchor(container)).toBeInTheDocument();
    expect(getProjectByNameAndVersion).toHaveBeenCalledTimes(1);
  });

  it("survives a hide and re-show of its tab without reloading the chunk", async () => {
    const { container, reshow, setMode } = renderTab();
    expect(await screen.findByText("content:ns:p-1")).toBeInTheDocument();
    const loadsAfterFirstMount = chunk.loads();

    setMode("hidden");
    expect(screen.queryByText("content:ns:p-1")).not.toBeVisible();

    setMode("visible");
    expect(screen.getByText("content:ns:p-1")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    reshow();
    expect(screen.getByText("content:ns:p-1")).toBeVisible();
    expect(anchor(container)).toBeInTheDocument();
    expect(chunk.loads()).toBe(loadsAfterFirstMount);
  });
});
