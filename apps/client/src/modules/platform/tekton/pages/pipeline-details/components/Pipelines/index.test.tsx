import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { pipelineRunLabels } from "@my-project/shared";
import { Pipelines } from "./index";

const mockUnifiedPipelineRunList = vi.fn();

vi.mock("@/modules/platform/tekton/components/UnifiedPipelineRunList", () => ({
  UnifiedPipelineRunList: (props: unknown) => {
    mockUnifiedPipelineRunList(props);
    return null;
  },
}));

vi.mock("../../route", () => ({
  routePipelineDetails: { useParams: () => ({ clusterName: "core", namespace: "krci", name: "gitlab-build" }) },
}));

describe("pipeline-details Pipelines tab", () => {
  it("scopes the list to the tekton.dev/pipeline label", () => {
    render(<Pipelines />);

    expect(mockUnifiedPipelineRunList).toHaveBeenCalledWith(
      expect.objectContaining({ labels: { [pipelineRunLabels.pipeline]: "gitlab-build" } })
    );
  });
});
