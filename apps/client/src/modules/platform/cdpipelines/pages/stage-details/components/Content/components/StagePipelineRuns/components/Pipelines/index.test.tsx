import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { getStageResourceName, pipelineRunLabels } from "@my-project/shared";
import { Pipelines } from "./index";

const mockUseUnifiedPipelineRunList = vi.fn();

vi.mock("@/modules/platform/tekton/hooks/useUnifiedPipelineRunList", () => ({
  useUnifiedPipelineRunList: (opts: unknown) => mockUseUnifiedPipelineRunList(opts),
}));

vi.mock("@/modules/platform/tekton/components/PipelineRunList", () => ({
  PipelineRunList: () => null,
}));

vi.mock("@/modules/platform/tekton/components/HistoryLoadingFooter", () => ({
  HistoryLoadingFooter: () => null,
}));

vi.mock("@/modules/platform/tekton/pages/pipelinerun-details/route", () => ({
  PATH_PIPELINERUN_DETAILS_FULL: "/c/$clusterName/pipelineruns/$namespace/$name",
}));

vi.mock("@/modules/platform/tekton/components/PipelineRunList/components/Filter/hooks/usePipelineRunFilter", () => ({
  useDebouncedPipelineRunSearch: () => "",
}));

vi.mock("@/core/providers/Filter/provider", () => ({
  FilterProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../../../../../route", () => ({
  routeStageDetails: {
    useParams: () => ({
      clusterName: "core",
      namespace: "edp-delivery",
      cdPipeline: "tekton",
      stage: "dev",
    }),
  },
}));

describe("stage-details Pipelines tab", () => {
  beforeEach(() => {
    mockUseUnifiedPipelineRunList.mockReset();
    mockUseUnifiedPipelineRunList.mockReturnValue({
      mergedPipelineRuns: [],
      isLoading: false,
      isHistoryLoading: false,
      historyQuery: { isLoading: false },
    });
  });

  it("filters by app.edp.epam.com/cdstage (not /stage) so operator-created runs appear", () => {
    render(<Pipelines />);

    expect(mockUseUnifiedPipelineRunList).toHaveBeenCalledTimes(1);
    const [opts] = mockUseUnifiedPipelineRunList.mock.calls[0] as [{ labels: Record<string, string> }];

    expect(opts.labels).toEqual({
      [pipelineRunLabels.cdPipeline]: "tekton",
      [pipelineRunLabels.cdStage]: getStageResourceName("tekton", "dev"),
    });
  });
});
