import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import {
  createMockPipelineRun,
  normalizeResultToPipelineRun,
  PipelineRun,
  pipelineRunLabels,
  TektonResult,
} from "@my-project/shared";
import { pipelineRunFilterControlNames } from "../PipelineRunList/components/Filter/constants";
import { UnifiedPipelineRunList } from "./index";

const mocks = vi.hoisted(() => ({
  useUnifiedPipelineRunList: vi.fn(),
  pipelineRunList: vi.fn(),
  historyLoadingFooter: vi.fn(),
}));

vi.mock("../../hooks/useUnifiedPipelineRunList", () => ({
  useUnifiedPipelineRunList: mocks.useUnifiedPipelineRunList,
}));

vi.mock("../PipelineRunList", () => ({
  PipelineRunList: (props: unknown) => {
    mocks.pipelineRunList(props);
    return null;
  },
}));

vi.mock("../HistoryLoadingFooter", () => ({
  HistoryLoadingFooter: (props: unknown) => {
    mocks.historyLoadingFooter(props);
    return null;
  },
}));

vi.mock("@/core/providers/Filter/provider", () => ({
  FilterProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../PipelineRunList/components/Filter/hooks/usePipelineRunFilter", () => ({
  usePipelineRunQueryFilters: () => ({
    searchTerm: "build-",
    status: "failed",
    pipelineType: "deploy",
    codebases: ["payments"],
    namespaces: ["krci"],
  }),
  usePipelineRunFilter: () => ({
    filterFunction: (run: PipelineRun) => !run.metadata.name.startsWith("hidden-"),
  }),
}));

const liveRun = (name: string) => createMockPipelineRun({ name, pipelineType: "deploy", status: "failed" });

const historyRun = (name: string) => {
  const result: TektonResult = {
    uid: name,
    name: `krci/results/${name}`,
    create_time: "2026-10-01T10:00:00Z",
    update_time: "2026-10-01T10:05:00Z",
  };
  return normalizeResultToPipelineRun(result, "krci");
};

const rows = [liveRun("live-1"), historyRun("history-1"), historyRun("history-2"), historyRun("hidden-history")];
const historyQuery = { hasNextPage: true };

describe("UnifiedPipelineRunList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useUnifiedPipelineRunList.mockReturnValue({
      mergedPipelineRuns: rows,
      isLoading: false,
      isHistoryLoading: false,
      historyQuery,
    });
  });

  it("applies the scope and every filter value to both sources", () => {
    render(
      <UnifiedPipelineRunList
        tableId="stage-pipelines"
        tableName="Stage pipelines"
        labels={{ [pipelineRunLabels.cdPipeline]: "tekton" }}
        enabled={false}
      />
    );

    expect(mocks.useUnifiedPipelineRunList).toHaveBeenCalledWith({
      labels: { [pipelineRunLabels.cdPipeline]: "tekton" },
      enabled: false,
      searchTerm: "build-",
      status: "failed",
      pipelineType: "deploy",
      codebases: ["payments"],
      namespaces: ["krci"],
    });
  });

  it("passes the table its rows and props", () => {
    const filterControls = [pipelineRunFilterControlNames.SEARCH, pipelineRunFilterControlNames.STATUS];

    render(
      <UnifiedPipelineRunList
        tableId="stage-pipelines"
        tableName="Stage pipelines"
        filterControls={filterControls}
        pagination={{ show: false }}
      />
    );

    expect(mocks.pipelineRunList).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: "stage-pipelines",
        tableName: "Stage pipelines",
        filterControls,
        pagination: { show: false },
        pipelineRuns: rows,
        isLoading: false,
      })
    );
  });

  it("counts history rows the table shows, not every merged history row", () => {
    render(<UnifiedPipelineRunList tableId="stage-pipelines" tableName="Stage pipelines" />);

    expect(mocks.historyLoadingFooter).toHaveBeenCalledWith({
      isHistoryLoading: false,
      historyQuery,
      visibleHistoryCount: 2,
    });
  });
});
