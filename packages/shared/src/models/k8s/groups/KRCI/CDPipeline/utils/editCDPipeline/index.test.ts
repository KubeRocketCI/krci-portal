import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { editCDPipelineObject } from "./index.js";

const mockCDPipeline = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CDPipeline",
  metadata: {
    name: "test-pipeline",
    namespace: "default",
    creationTimestamp: "2023-01-01T00:00:00Z",
    uid: "test-uid-123",
  },
  spec: {
    name: "test-pipeline",
    applications: ["app1"],
    applicationsToPromote: ["app1"],
    deploymentType: "container",
    description: "old description",
    inputDockerStreams: ["app1-main"],
  },
} as const;

describe("editCDPipelineObject", () => {
  it("should update editable fields", () => {
    const input = {
      description: "new description",
      applications: ["app1", "app2"],
      inputDockerStreams: ["app1-main", "app2-main"],
      applicationsToPromote: ["app2"],
    };

    const result = editCDPipelineObject(mockCDPipeline as any, input);

    expect(result.spec.description).toBe("new description");
    expect(result.spec.applications).toEqual(["app1", "app2"]);
    expect(result.spec.inputDockerStreams).toEqual(["app1-main", "app2-main"]);
    expect(result.spec.applicationsToPromote).toEqual(["app2"]);
  });

  it("should preserve non-editable fields", () => {
    const input = {
      description: "updated",
      applications: ["app1"],
      inputDockerStreams: ["app1-main"],
      applicationsToPromote: ["app1"],
    };

    const result = editCDPipelineObject(mockCDPipeline as any, input);

    expect(result.metadata).toEqual(mockCDPipeline.metadata);
    expect(result.apiVersion).toBe(mockCDPipeline.apiVersion);
    expect(result.kind).toBe(mockCDPipeline.kind);
    expect(result.spec.name).toBe(mockCDPipeline.spec.name);
    expect(result.spec.deploymentType).toBe(mockCDPipeline.spec.deploymentType);
  });

  it("should throw ZodError on invalid input - wrong type for applications", () => {
    expect(() =>
      editCDPipelineObject(mockCDPipeline as any, {
        description: "test",
        applications: "not-array" as any,
        inputDockerStreams: ["stream"],
        applicationsToPromote: [],
      })
    ).toThrow(ZodError);
  });

  it("should throw ZodError on missing required fields", () => {
    expect(() =>
      editCDPipelineObject(
        mockCDPipeline as any,
        {
          description: "test",
        } as any
      )
    ).toThrow(ZodError);
  });

  it("should handle optional description", () => {
    const input = {
      description: undefined,
      applications: ["app1"],
      inputDockerStreams: ["app1-main"],
      applicationsToPromote: null,
    };

    const result = editCDPipelineObject(mockCDPipeline as any, input as any);

    expect(result.spec.applications).toEqual(["app1"]);
  });
});
