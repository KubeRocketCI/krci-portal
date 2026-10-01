import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { pipelineRunLabels } from "@my-project/shared";
import { Pipelines } from "./index";

const mocks = vi.hoisted(() => ({
  unifiedPipelineRunList: vi.fn(),
  params: { clusterName: "core", namespace: "krci", name: "payments" },
}));

vi.mock("@/modules/platform/tekton/components/UnifiedPipelineRunList", () => ({
  UnifiedPipelineRunList: (props: unknown) => {
    mocks.unifiedPipelineRunList(props);
    return null;
  },
}));

vi.mock("../../../../route", () => ({
  routeProjectDetails: { useParams: () => mocks.params },
}));

describe("project-details Pipelines tab", () => {
  beforeEach(() => {
    mocks.unifiedPipelineRunList.mockReset();
    mocks.params.name = "payments";
  });

  it("scopes the list to the codebase label", () => {
    render(<Pipelines />);

    expect(mocks.unifiedPipelineRunList).toHaveBeenCalledWith(
      expect.objectContaining({ labels: { [pipelineRunLabels.codebase]: "payments" }, enabled: true })
    );
  });

  it("defers both sources until the codebase name resolves", () => {
    mocks.params.name = "";

    render(<Pipelines />);

    expect(mocks.unifiedPipelineRunList).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
