import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { getStageResourceName, pipelineRunLabels } from "@my-project/shared";
import { Pipelines } from "./index";

const mockUnifiedPipelineRunList = vi.fn();

vi.mock("@/modules/platform/tekton/components/UnifiedPipelineRunList", () => ({
  UnifiedPipelineRunList: (props: unknown) => {
    mockUnifiedPipelineRunList(props);
    return null;
  },
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
    mockUnifiedPipelineRunList.mockReset();
  });

  it("filters by app.edp.epam.com/cdstage (not /stage) so operator-created runs appear", () => {
    render(<Pipelines />);

    expect(mockUnifiedPipelineRunList).toHaveBeenCalledTimes(1);
    const [props] = mockUnifiedPipelineRunList.mock.calls[0] as [{ labels: Record<string, string> }];

    expect(props.labels).toEqual({
      [pipelineRunLabels.cdPipeline]: "tekton",
      [pipelineRunLabels.cdStage]: getStageResourceName("tekton", "dev"),
    });
  });
});
