import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tabNameToIndexMap } from "../constants";
import { usePageTabs } from "./usePageTabs";

vi.mock("@/core/router", () => ({ router: { navigate: vi.fn() } }));
vi.mock("@/core/hooks/useIdleCallback", () => ({ useIdleCallback: vi.fn() }));
vi.mock("./data", () => ({ useCodebaseWatch: () => ({ query: { data: { spec: { defaultBranch: "main" } } } }) }));
const routeSearch = vi.hoisted(() => ({ current: {} as { cdPipeline?: string; stage?: string } }));

vi.mock("../route", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../route")>()),
  routeProjectDetails: {
    useParams: () => ({ name: "app", namespace: "ns", clusterName: "cluster" }),
    useSearch: () => routeSearch.current,
  },
}));

vi.mock("../components/BranchList", () => ({ BranchList: () => null }));
vi.mock("../components/PullRequestList", () => ({ PullRequestList: () => null }));
vi.mock("../components/Overview", () => ({ Overview: () => null }));
vi.mock("../components/PipelineList", () => ({ PipelineList: () => null }));
vi.mock("../components/DeploymentStatusWidget", () => ({ DeploymentStatusWidget: () => null }));
vi.mock("../components/SecurityTab", () => ({ SecurityTab: () => null }));
vi.mock("../components/SecurityFindingsTab", () => ({ SecurityFindingsTab: () => null }));
vi.mock("../components/VulnerabilitiesTab", () => ({
  VulnerabilitiesTab: Object.assign(() => null, { preload: vi.fn() }),
}));
vi.mock("@/modules/platform/gitlabci/components/CodebaseGitLabCIPipelineList", () => ({
  CodebaseGitLabCIPipelineList: () => null,
}));

const getTabs = () => renderHook(() => usePageTabs()).result.current;

const getFocus = () => {
  const component = getTabs().find((tab) => tab.id === "findings")?.component;
  if (!React.isValidElement<{ focus?: unknown }>(component)) {
    throw new Error("The Security Findings tab is an element");
  }
  return component.props.focus;
};

describe("usePageTabs", () => {
  beforeEach(() => {
    routeSearch.current = {};
  });

  it("puts the Security Findings tab after Dependencies and leaves Code Quality and Dependencies as they were", () => {
    expect(getTabs().map((tab) => [tab.id, tab.label])).toEqual([
      ["overview", "Overview"],
      ["branches", "Branches"],
      ["pipelines", "Pipelines"],
      ["security", "Code Quality"],
      ["vulnerabilities", "Dependencies"],
      ["findings", "Security Findings"],
      ["code", "Pull Requests"],
      ["deployments", "Deployments"],
    ]);
  });

  it("is opened by ?tab=<id> at the index of the tab: the page starts on tabNameToIndexMap[tab]", () => {
    getTabs().forEach((tab, position) => {
      expect(tabNameToIndexMap[tab.id as keyof typeof tabNameToIndexMap], tab.id).toBe(position);
    });
  });

  describe("the Environment in focus on the Security Findings tab", () => {
    it("is the CDPipeline and the stage of the route search", () => {
      routeSearch.current = { cdPipeline: "demo", stage: "dev" };

      expect(getFocus()).toEqual({ cdPipeline: "demo", stage: "dev" });
    });

    it("is none without them", () => {
      expect(getFocus()).toBeNull();
    });

    it.each([
      ["cdPipeline", { cdPipeline: "demo" }],
      ["stage", { stage: "dev" }],
    ])("is none for the %s alone: one parameter names no Environment", (_, search) => {
      routeSearch.current = search;

      expect(getFocus()).toBeNull();
    });
  });
});
