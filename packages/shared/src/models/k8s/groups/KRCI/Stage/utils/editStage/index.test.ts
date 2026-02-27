import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { editStageObject } from "./index.js";

const mockStage = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Stage",
  metadata: {
    name: "test-stage",
    namespace: "default",
    creationTimestamp: "2023-01-01T00:00:00Z",
    uid: "test-uid-123",
    labels: {
      "app.edp.epam.com/cdPipelineName": "test-pipeline",
    },
  },
  spec: {
    cdPipeline: "test-pipeline",
    cleanTemplate: "old-clean",
    clusterName: "in-cluster",
    description: "stage desc",
    name: "test-stage",
    namespace: "default",
    order: 0,
    qualityGates: [{ qualityGateType: "manual", stepName: "approve" }],
    triggerTemplate: "old-trigger-template",
    triggerType: "Manual",
  },
} as const;

describe("editStageObject", () => {
  it("should update editable fields", () => {
    const input = {
      triggerType: "Auto" as const,
      triggerTemplate: "new-trigger-template",
      cleanTemplate: "new-clean",
      qualityGates: [{ qualityGateType: "manual" as const, stepName: "approve", autotestName: null, branchName: null }],
    };

    const result = editStageObject(mockStage as any, input);

    expect(result.spec.triggerType).toBe("Auto");
    expect(result.spec.triggerTemplate).toBe("new-trigger-template");
    expect(result.spec.cleanTemplate).toBe("new-clean");
    expect(result.spec.qualityGates).toEqual([
      { qualityGateType: "manual", stepName: "approve", autotestName: null, branchName: null },
    ]);
  });

  it("should preserve non-editable fields", () => {
    const input = {
      triggerType: "Manual" as const,
      triggerTemplate: "updated",
      cleanTemplate: "updated",
      qualityGates: [{ qualityGateType: "manual" as const, stepName: "approve", autotestName: null, branchName: null }],
    };

    const result = editStageObject(mockStage as any, input);

    expect(result.metadata).toEqual(mockStage.metadata);
    expect(result.apiVersion).toBe(mockStage.apiVersion);
    expect(result.kind).toBe(mockStage.kind);
    expect(result.spec.cdPipeline).toBe("test-pipeline");
    expect(result.spec.name).toBe("test-stage");
    expect(result.spec.order).toBe(0);
  });

  it("should throw ZodError on invalid triggerType", () => {
    expect(() =>
      editStageObject(mockStage as any, {
        triggerType: "InvalidType" as any,
        triggerTemplate: "template",
        cleanTemplate: "clean",
        qualityGates: [
          { qualityGateType: "manual" as const, stepName: "approve", autotestName: null, branchName: null },
        ],
      })
    ).toThrow(ZodError);
  });

  it("should throw ZodError on missing required fields", () => {
    expect(() =>
      editStageObject(
        mockStage as any,
        {
          triggerType: "Manual",
        } as any
      )
    ).toThrow(ZodError);
  });
});
