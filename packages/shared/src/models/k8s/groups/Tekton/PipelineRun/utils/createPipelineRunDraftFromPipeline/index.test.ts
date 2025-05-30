import { beforeAll, describe, expect, it, Mock, vi } from "vitest";
import { createRandomString } from "../../../../../../../utils";
import { Pipeline } from "../../../Pipeline/types";
import { TriggerTemplate } from "../../../TriggerTemplate";
import { createPipelineRunDraftFromPipeline } from "./index";

vi.mock("../../../../../../../utils", () => ({
  createRandomString: vi.fn(),
}));

describe("testing createPipelineRunDraftFromPipeline", () => {
  const MOCKED_RANDOM_STRING = "rand123";

  beforeAll(() => {
    (createRandomString as Mock).mockReturnValue(MOCKED_RANDOM_STRING);
  });

  it("should return a valid pipeline run object when triggerTemplate is undefined", () => {
    const pipeline = {
      metadata: {
        name: "example-pipeline",
        namespace: "example-namespace",
      },
      spec: {
        params: [
          { name: "param1", default: "value1" },
          { name: "param2", default: "value2" },
          { name: "param3", default: "" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      undefined as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result).toEqual({
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRun",
      metadata: {
        name: "run-example-pipeline-rand123",
        namespace: "example-namespace",
      },
      spec: {
        pipelineRef: {
          name: "example-pipeline",
        },
        params: [
          { name: "param1", value: "value1" },
          { name: "param2", value: "value2" },
          { name: "param3", value: "" },
        ],
      },
    });
    expect(createRandomString).toHaveBeenCalledTimes(1);
  });

  it("should return a pipeline run object from triggerTemplate when triggerTemplate is defined", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {},
            spec: {
              pipelineRef: {
                name: "old-pipeline-name",
              },
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: {
        name: "new-pipeline-name",
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result).toEqual({
      metadata: {},
      spec: {
        pipelineRef: {
          name: "new-pipeline-name",
        },
      },
    });
  });
});
