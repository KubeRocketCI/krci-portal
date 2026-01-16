import { describe, expect, it } from "vitest";
import { createStageDraftObject } from "./index.js";
import { ZodError } from "zod";

const baseInput = {
  name: "test-stage",
  cdPipeline: "test-pipeline",
  namespace: "test-namespace",
  order: 1,
  triggerTemplate: "test-trigger-template",
  qualityGates: [
    {
      stepName: "test-step",
      qualityGateType: "manual" as const,
    },
  ],
  clusterName: "in-cluster",
  triggerType: "Manual" as const,
  description: "Test Stage",
  cleanTemplate: "test-clean-template",
  source: {
    type: "default" as const,
  },
};

describe("K8sStage: createStageDraft", () => {
  it("should create a valid stage draft", () => {
    const result = createStageDraftObject(baseInput);

    expect(result).toMatchObject({
      apiVersion: "v2.edp.epam.com/v1",
      kind: "Stage",
      metadata: {
        name: "test-pipeline-test-stage",
        labels: {
          "app.edp.epam.com/cdPipelineName": "test-pipeline",
        },
      },
      spec: {
        name: "test-stage",
        cdPipeline: "test-pipeline",
        namespace: "test-namespace",
        order: 1,
        triggerTemplate: "test-trigger-template",
        qualityGates: [
          {
            stepName: "test-step",
            qualityGateType: "manual",
          },
        ],
        clusterName: "in-cluster",
        triggerType: "Manual",
        description: "Test Stage",
        cleanTemplate: "test-clean-template",
        source: {
          type: "default",
        },
      },
    });
  });

  it("should throw ZodError when name is not provided", () => {
    const inputWithoutName = { ...baseInput };
    delete (inputWithoutName as any).name;

    expect(() => createStageDraftObject(inputWithoutName)).toThrowError(ZodError);
  });

  it("should use default cluster name when not specified", () => {
    const inputWithoutClusterName = { ...baseInput };
    delete (inputWithoutClusterName as any).clusterName;

    const result = createStageDraftObject(inputWithoutClusterName);

    expect(result.spec.clusterName).toBe("in-cluster");
  });

  it("should use default trigger type when not specified", () => {
    const inputWithoutTriggerType = { ...baseInput };
    delete (inputWithoutTriggerType as any).triggerType;

    const result = createStageDraftObject(inputWithoutTriggerType);

    expect(result.spec.triggerType).toBe("Manual");
  });

  it("should handle Auto trigger type", () => {
    const result = createStageDraftObject({
      ...baseInput,
      triggerType: "Auto",
    });

    expect(result.spec.triggerType).toBe("Auto");
  });

  it("should handle Auto-stable trigger type", () => {
    const result = createStageDraftObject({
      ...baseInput,
      triggerType: "Auto-stable",
    });

    expect(result.spec.triggerType).toBe("Auto-stable");
  });

  it("should handle autotests quality gate type", () => {
    const result = createStageDraftObject({
      ...baseInput,
      qualityGates: [
        {
          stepName: "autotest-step",
          qualityGateType: "autotests",
          autotestName: "test-autotest",
          branchName: "main",
        },
      ],
    });

    expect(result.spec.qualityGates[0]).toMatchObject({
      stepName: "autotest-step",
      qualityGateType: "autotests",
      autotestName: "test-autotest",
      branchName: "main",
    });
  });

  it("should use default quality gate type when not specified", () => {
    const result = createStageDraftObject({
      ...baseInput,
      qualityGates: [
        {
          stepName: "default-step",
          qualityGateType: "manual" as const,
        },
      ],
    });

    expect(result.spec.qualityGates[0].qualityGateType).toBe("manual");
  });

  it("should handle library source type", () => {
    const result = createStageDraftObject({
      ...baseInput,
      source: {
        type: "library",
        library: {
          name: "test-library",
          branch: "main",
        },
      },
    });

    expect(result.spec.source).toMatchObject({
      type: "library",
      library: {
        name: "test-library",
        branch: "main",
      },
    });
  });

  it("should handle default source type when not specified", () => {
    const inputWithSource = {
      ...baseInput,
      source: {
        type: "default" as const,
      },
    };

    const result = createStageDraftObject(inputWithSource);

    expect(result.spec.source?.type).toBe("default");
  });

  it("should handle optional fields being undefined", () => {
    const minimalInput = {
      name: "minimal-stage",
      cdPipeline: "test-pipeline",
      namespace: "test-namespace",
      order: 1,
      triggerTemplate: "test-trigger-template",
      qualityGates: [
        {
          stepName: "test-step",
          qualityGateType: "manual" as const,
        },
      ],
      clusterName: "in-cluster",
      triggerType: "Manual" as const,
    };

    const result = createStageDraftObject(minimalInput);

    expect(result.spec.description).toBeUndefined();
    expect(result.spec.cleanTemplate).toBeUndefined();
    expect(result.spec.source).toBeUndefined();
  });

  it("should handle multiple quality gates", () => {
    const result = createStageDraftObject({
      ...baseInput,
      qualityGates: [
        {
          stepName: "manual-step",
          qualityGateType: "manual",
        },
        {
          stepName: "autotest-step",
          qualityGateType: "autotests",
          autotestName: "test-autotest",
        },
      ],
    });

    expect(result.spec.qualityGates).toHaveLength(2);
    expect(result.spec.qualityGates[0].stepName).toBe("manual-step");
    expect(result.spec.qualityGates[1].stepName).toBe("autotest-step");
  });

  it("should throw ZodError on missing required fields", () => {
    expect(() =>
      createStageDraftObject({
        name: "invalid",
      } as any)
    ).toThrowError(ZodError);
  });

  it("should allow empty qualityGates array", () => {
    const result = createStageDraftObject({
      ...baseInput,
      qualityGates: [],
    });

    expect(result.spec.qualityGates).toEqual([]);
  });

  it("should throw ZodError on invalid trigger type", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        triggerType: "Invalid" as any,
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on invalid quality gate type", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        qualityGates: [
          {
            stepName: "test-step",
            qualityGateType: "invalid" as any,
          },
        ],
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on invalid source type", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        source: {
          type: "invalid" as any,
        },
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on name that is too short", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        name: "a", // too short (minimum is 2 characters)
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on cdPipeline that is too short", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        cdPipeline: "a", // too short (minimum is 2 characters)
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on stepName that is too short", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        qualityGates: [
          {
            stepName: "a", // too short (minimum is 2 characters)
            qualityGateType: "manual" as const,
          },
        ],
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on invalid order type", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        order: "not-a-number" as any,
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on missing namespace", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        namespace: undefined as any,
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on missing triggerTemplate", () => {
    expect(() =>
      createStageDraftObject({
        ...baseInput,
        triggerTemplate: undefined as any,
      })
    ).toThrowError(ZodError);
  });

  it("should handle negative order numbers", () => {
    const result = createStageDraftObject({
      ...baseInput,
      order: -1,
    });

    expect(result.spec.order).toBe(-1);
  });

  it("should handle large order numbers", () => {
    const result = createStageDraftObject({
      ...baseInput,
      order: 1000,
    });

    expect(result.spec.order).toBe(1000);
  });
});
