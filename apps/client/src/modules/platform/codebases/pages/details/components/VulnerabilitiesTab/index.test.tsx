import React from "react";
import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInActivity } from "@/test/utils/activity";
import { VulnerabilitiesTab } from "./index";
import type { VulnerabilitiesTabProps } from "./types";

const chunk = vi.hoisted(() => {
  let resolve!: () => void;
  let loads = 0;
  const promise = new Promise<{ VulnerabilitiesTabContent: (p: { codebaseName: string }) => React.ReactElement }>(
    (res) => {
      resolve = () => res({ VulnerabilitiesTabContent: (p) => <span>content:{p.codebaseName}</span> });
    }
  );
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

const props: VulnerabilitiesTabProps = {
  codebaseName: "app",
  defaultBranch: "main",
  namespace: "ns",
  clusterName: "cluster",
};

const anchor = (container: HTMLElement) => container.querySelector('[data-tour="dependencies-widget"]');

// The mocked chunk is one module-level promise: only the first test observes the pending state.
describe("VulnerabilitiesTab", () => {
  it("keeps the tour anchor and a spinner while the chunk is pending, and shows the content on re-show after it resolved while hidden", async () => {
    const { container, setMode } = renderInActivity(() => <VulnerabilitiesTab {...props} />);

    expect(anchor(container)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("content:app")).not.toBeInTheDocument();

    setMode("hidden");
    await act(async () => chunk.resolve());
    setMode("visible");

    expect(await screen.findByText("content:app")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(anchor(container)).toBeInTheDocument();
  });

  it("survives a hide and re-show of its tab without reloading the chunk", async () => {
    const { container, reshow, setMode } = renderInActivity(() => <VulnerabilitiesTab {...props} />);
    expect(await screen.findByText("content:app")).toBeInTheDocument();
    const loadsAfterFirstMount = chunk.loads();

    setMode("hidden");
    expect(screen.queryByText("content:app")).not.toBeVisible();

    setMode("visible");
    expect(screen.getByText("content:app")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    reshow();
    expect(screen.getByText("content:app")).toBeVisible();
    expect(anchor(container)).toBeInTheDocument();
    expect(chunk.loads()).toBe(loadsAfterFirstMount);
  });
});
