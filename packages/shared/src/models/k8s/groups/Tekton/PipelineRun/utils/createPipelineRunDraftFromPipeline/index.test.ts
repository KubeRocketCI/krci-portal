import { beforeAll, describe, expect, it, Mock, vi } from "vitest";
import { createRandomString } from "../../../../../../../utils/index.js";
import { Pipeline } from "../../../Pipeline/types.js";
import { TriggerTemplate } from "../../../TriggerTemplate/index.js";
import { createPipelineRunDraftFromPipeline } from "./index.js";

vi.mock("../../../../../../../utils", () => ({
  createRandomString: vi.fn(),
  truncateName: vi.fn((name: string) => name),
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
        labels: {
          "app.edp.epam.com/pipelinetype": "build",
        },
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
        labels: {
          "app.edp.epam.com/pipelinetype": "build",
          "tekton.dev/pipeline": "example-pipeline",
        },
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

  it("TT path: resolves $(tt.params.*) string placeholders to Pipeline defaults", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {},
            spec: {
              pipelineRef: { name: "old-name" },
              params: [
                { name: "git-source-url", value: "$(tt.params.git-source-url)" },
                { name: "git-source-revision", value: "$(tt.params.git-source-revision)" },
              ],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "my-pipeline" },
      spec: {
        params: [
          { name: "git-source-url", type: "string", default: "https://github.com/example/repo.git" },
          { name: "git-source-revision", type: "string", default: "main" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.params).toEqual([
      { name: "git-source-url", value: "https://github.com/example/repo.git" },
      { name: "git-source-revision", value: "main" },
    ]);
  });

  it("TT path: resolves $(tt.params.*) array placeholder to [] when Pipeline param has no default", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {},
            spec: {
              pipelineRef: { name: "image-scan-remote" },
              params: [
                { name: "IMAGE_NAMES", value: "$(tt.params.IMAGE_NAMES)" },
                { name: "CODEBASE_NAME", value: "$(tt.params.CODEBASE_NAME)" },
              ],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "image-scan-remote" },
      spec: {
        params: [
          { name: "IMAGE_NAMES", type: "array" },
          { name: "CODEBASE_NAME", type: "string" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.params).toEqual([
      { name: "IMAGE_NAMES", value: [] },
      { name: "CODEBASE_NAME", value: "" },
    ]);
  });

  it("TT path: uses Pipeline array default when present", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {},
            spec: {
              pipelineRef: { name: "my-pipeline" },
              params: [{ name: "TAGS", value: "$(tt.params.TAGS)" }],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "my-pipeline" },
      spec: {
        params: [{ name: "TAGS", type: "array", default: ["latest", "stable"] }],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.params).toEqual([{ name: "TAGS", value: ["latest", "stable"] }]);
  });

  it("TT path: resolves $(tt.params.*) in metadata.labels (K8s rejects $ and () in label values)", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {
              generateName: "deploy-ansible-run-",
              labels: {
                "app.edp.epam.com/cdpipeline": "$(tt.params.CDPIPELINE)",
                "app.edp.epam.com/cdstage": "$(tt.params.CDSTAGE)",
                "app.edp.epam.com/pipelinetype": "deploy",
              },
            },
            spec: {
              pipelineRef: { name: "deploy-ansible" },
              params: [
                { name: "CDPIPELINE", value: "$(tt.params.CDPIPELINE)" },
                { name: "CDSTAGE", value: "$(tt.params.CDSTAGE)" },
              ],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "deploy-ansible" },
      spec: {
        params: [
          { name: "CDPIPELINE", type: "string" },
          { name: "CDSTAGE", type: "string", default: "dev" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    // Labels must not contain $() — K8s returns 422 for those characters.
    expect(result.metadata.labels?.["app.edp.epam.com/cdpipeline"]).toBe("");
    expect(result.metadata.labels?.["app.edp.epam.com/cdstage"]).toBe("dev");
    // Non-placeholder label passes through unchanged.
    expect(result.metadata.labels?.["app.edp.epam.com/pipelinetype"]).toBe("deploy");
    // spec.params are also resolved correctly.
    expect(result.spec.params).toEqual([
      { name: "CDPIPELINE", value: "" },
      { name: "CDSTAGE", value: "dev" },
    ]);
  });

  it('TT path: array param gets [] in spec.params even after string pass set it to ""', () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {
              labels: { "app.edp.epam.com/images": "$(tt.params.IMAGE_NAMES)" },
            },
            spec: {
              pipelineRef: { name: "image-scan" },
              params: [{ name: "IMAGE_NAMES", value: "$(tt.params.IMAGE_NAMES)" }],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "image-scan" },
      spec: {
        params: [{ name: "IMAGE_NAMES", type: "array" }],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    // In spec.params the array param must be [] (not "").
    expect(result.spec.params).toEqual([{ name: "IMAGE_NAMES", value: [] }]);
    // In the label (string context) it stays "".
    expect(result.metadata.labels?.["app.edp.epam.com/images"]).toBe("");
  });

  it("TT path: resolves composite $(tt.params.*) label values like $(tt.params.A)-$(tt.params.B)", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {
              labels: {
                "app.edp.epam.com/cdstage": "$(tt.params.CDPIPELINE)-$(tt.params.CDSTAGE)",
                "app.edp.epam.com/pipelinetype": "deploy",
              },
            },
            spec: {
              pipelineRef: { name: "deploy-ansible" },
              params: [],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "deploy-ansible" },
      spec: {
        params: [
          { name: "CDPIPELINE", type: "string", default: "my-pipeline" },
          { name: "CDSTAGE", type: "string", default: "dev" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    // Composite placeholder is interpolated — no forbidden characters remain.
    expect(result.metadata.labels?.["app.edp.epam.com/cdstage"]).toBe("my-pipeline-dev");
    // Non-placeholder label is unchanged.
    expect(result.metadata.labels?.["app.edp.epam.com/pipelinetype"]).toBe("deploy");
  });

  it("TT path: composite label resolving to '-' (no defaults) is sanitized to ''", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {
              labels: {
                "app.edp.epam.com/cdstage": "$(tt.params.CDPIPELINE)-$(tt.params.CDSTAGE)",
                "app.edp.epam.com/pipelinetype": "deploy",
              },
            },
            spec: { pipelineRef: { name: "deploy-ansible" }, params: [] },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "deploy-ansible" },
      spec: {
        // Neither param has a default → both resolve to "" → composite is "-"
        params: [
          { name: "CDPIPELINE", type: "string" },
          { name: "CDSTAGE", type: "string" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    // "-" is not a valid K8s label value — must be sanitized to "".
    expect(result.metadata.labels?.["app.edp.epam.com/cdstage"]).toBe("");
    expect(result.metadata.labels?.["app.edp.epam.com/pipelinetype"]).toBe("deploy");
  });

  it("TT path: non-placeholder param values are left unchanged", () => {
    const triggerTemplate = {
      spec: {
        resourcetemplates: [
          {
            metadata: {},
            spec: {
              pipelineRef: { name: "my-pipeline" },
              params: [{ name: "static-param", value: "hardcoded-value" }],
            },
          },
        ],
      },
    };
    const pipeline = {
      metadata: { name: "my-pipeline" },
      spec: {
        params: [{ name: "static-param", type: "string", default: "different-value" }],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      triggerTemplate as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.params).toEqual([{ name: "static-param", value: "hardcoded-value" }]);
  });

  it("no-TT path: workspaces get volumeClaimTemplate bindings", () => {
    const pipeline = {
      metadata: {
        name: "autotests-gradle",
        namespace: "edp",
        labels: { "app.edp.epam.com/pipelinetype": "tests" },
      },
      spec: {
        params: [{ name: "git-source-url", type: "string", default: "https://github.com/example.git" }],
        workspaces: [{ name: "shared-workspace" }, { name: "ssh-creds" }],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      undefined as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.workspaces).toEqual([
      {
        name: "shared-workspace",
        volumeClaimTemplate: {
          spec: {
            accessModes: ["ReadWriteOnce"],
            resources: { requests: { storage: "1Gi" } },
          },
        },
      },
      {
        name: "ssh-creds",
        volumeClaimTemplate: {
          spec: {
            accessModes: ["ReadWriteOnce"],
            resources: { requests: { storage: "1Gi" } },
          },
        },
      },
    ]);
  });

  it("no-TT path: pipeline with no workspaces omits the field entirely", () => {
    const pipeline = {
      metadata: {
        name: "simple-pipeline",
        namespace: "edp",
        labels: { "app.edp.epam.com/pipelinetype": "build" },
      },
      spec: { params: [] },
    };

    const result = createPipelineRunDraftFromPipeline(
      undefined as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.workspaces).toBeUndefined();
  });

  it('no-TT path: array param with no default gets [] not ""', () => {
    const pipeline = {
      metadata: {
        name: "scan-pipeline",
        namespace: "edp",
        labels: { "app.edp.epam.com/pipelinetype": "security" },
      },
      spec: {
        params: [
          { name: "IMAGE_NAMES", type: "array" },
          { name: "CODEBASE_NAME", type: "string", default: "my-app" },
        ],
      },
    };

    const result = createPipelineRunDraftFromPipeline(
      undefined as unknown as TriggerTemplate,
      pipeline as unknown as Pipeline
    );

    expect(result.spec.params).toEqual([
      { name: "IMAGE_NAMES", value: [] },
      { name: "CODEBASE_NAME", value: "my-app" },
    ]);
  });
});
