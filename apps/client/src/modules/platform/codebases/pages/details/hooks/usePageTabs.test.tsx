import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tabNameToIndexMap } from "../constants";
import { usePageTabs } from "./usePageTabs";

vi.mock("@/core/router", () => ({ router: { navigate: vi.fn() } }));
vi.mock("@/core/hooks/useIdleCallback", () => ({ useIdleCallback: vi.fn() }));
vi.mock("./data", () => ({ useCodebaseWatch: () => ({ query: { data: { spec: { defaultBranch: "main" } } } }) }));
vi.mock("../route", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../route")>()),
  routeProjectDetails: { useParams: () => ({ name: "app", namespace: "ns", clusterName: "cluster" }) },
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

describe("usePageTabs", () => {
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
});
