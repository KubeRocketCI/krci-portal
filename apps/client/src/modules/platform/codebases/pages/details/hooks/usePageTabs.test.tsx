import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePageTabs } from "./usePageTabs";

const { storeState } = vi.hoisted(() => ({ storeState: { defectDojoWebUrl: "" } }));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

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

const getTabIds = () => renderHook(() => usePageTabs()).result.current.map((tab) => tab.id);

describe("usePageTabs", () => {
  beforeEach(() => {
    storeState.defectDojoWebUrl = "";
  });

  it("has no findings tab while DefectDojo is not configured", () => {
    expect(getTabIds()).toEqual([
      "overview",
      "branches",
      "pipelines",
      "security",
      "vulnerabilities",
      "code",
      "deployments",
    ]);
  });

  it("adds the findings tab after Dependencies and before Pull Requests when DefectDojo is configured", () => {
    storeState.defectDojoWebUrl = "https://dd.example.com";

    expect(getTabIds()).toEqual([
      "overview",
      "branches",
      "pipelines",
      "security",
      "vulnerabilities",
      "findings",
      "code",
      "deployments",
    ]);
  });

  it("labels the findings tab Security", () => {
    storeState.defectDojoWebUrl = "https://dd.example.com";

    const tabs = renderHook(() => usePageTabs()).result.current;

    expect(tabs.find((tab) => tab.id === "findings")?.label).toBe("Security");
    expect(tabs.find((tab) => tab.id === "security")?.label).toBe("Code Quality");
  });
});
