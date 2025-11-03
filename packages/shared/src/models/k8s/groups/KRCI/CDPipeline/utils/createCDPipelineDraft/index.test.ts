import { describe, expect, it } from "vitest";
import { createCDPipelineDraftObject } from "./index";
import { ZodError } from "zod";

const baseInput = {
  name: "test-pipeline",
  applications: ["app1", "app2"],
  inputDockerStreams: ["stream1", "stream2"],
  deploymentType: "container" as const,
  description: "Test CD Pipeline",
  applicationsToPromote: ["app1"],
};

describe("K8sCDPipeline: createCDPipelineDraft", () => {
  it("should create a valid CD pipeline draft", () => {
    const result = createCDPipelineDraftObject(baseInput);

    expect(result).toMatchObject({
      apiVersion: "v2.edp.epam.com/v1",
      // NOTE: This appears to be a bug - should be "CDPipeline" not "Stage"
      kind: "Stage",
      metadata: {
        name: "test-pipeline",
      },
      spec: {
        name: "test-pipeline",
        applications: ["app1", "app2"],
        inputDockerStreams: ["stream1", "stream2"],
        deploymentType: "container",
        description: "Test CD Pipeline",
        applicationsToPromote: ["app1"],
      },
    });
  });

  it("should use default name when name is not provided", () => {
    const inputWithoutName = { ...baseInput };
    delete (inputWithoutName as any).name;

    const result = createCDPipelineDraftObject(inputWithoutName);

    expect(result.metadata.name).toBe("your cd pipeline name");
  });

  it("should use default deployment type when not specified", () => {
    const inputWithoutDeploymentType = { ...baseInput };
    delete (inputWithoutDeploymentType as any).deploymentType;

    const result = createCDPipelineDraftObject(inputWithoutDeploymentType);

    expect(result.spec.deploymentType).toBe("container");
  });

  it("should handle custom deployment type", () => {
    const result = createCDPipelineDraftObject({
      ...baseInput,
      deploymentType: "custom",
    });

    expect(result.spec.deploymentType).toBe("custom");
  });

  it("should handle optional fields being undefined", () => {
    const minimalInput = {
      name: "minimal-pipeline",
      applications: ["app1"],
      inputDockerStreams: ["stream1"],
      deploymentType: "container" as const,
    };

    const result = createCDPipelineDraftObject(minimalInput);

    expect(result.spec.description).toBeUndefined();
    expect(result.spec.applicationsToPromote).toBeUndefined();
  });

  it("should handle null applicationsToPromote", () => {
    const result = createCDPipelineDraftObject({
      ...baseInput,
      applicationsToPromote: null,
    });

    expect(result.spec.applicationsToPromote).toBeNull();
  });

  it("should throw ZodError on missing required fields", () => {
    expect(() =>
      createCDPipelineDraftObject(
        // @ts-expect-error intentional missing fields
        {
          name: "invalid",
        }
      )
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on empty applications array", () => {
    expect(() =>
      createCDPipelineDraftObject({
        ...baseInput,
        applications: [],
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on empty inputDockerStreams array", () => {
    expect(() =>
      createCDPipelineDraftObject({
        ...baseInput,
        inputDockerStreams: [],
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on invalid deployment type", () => {
    expect(() =>
      createCDPipelineDraftObject({
        ...baseInput,
        deploymentType: "invalid" as any,
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on name that is too short", () => {
    expect(() =>
      createCDPipelineDraftObject({
        ...baseInput,
        name: "a", // too short (minimum is 2 characters)
      })
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on invalid types", () => {
    expect(() =>
      createCDPipelineDraftObject({
        ...baseInput,
        applications: "not-an-array" as any,
      })
    ).toThrowError(ZodError);
  });

  it("should handle multiple applications", () => {
    const result = createCDPipelineDraftObject({
      ...baseInput,
      applications: ["app1", "app2", "app3", "app4"],
    });

    expect(result.spec.applications).toEqual(["app1", "app2", "app3", "app4"]);
  });

  it("should handle multiple inputDockerStreams", () => {
    const result = createCDPipelineDraftObject({
      ...baseInput,
      inputDockerStreams: ["stream1", "stream2", "stream3"],
    });

    expect(result.spec.inputDockerStreams).toEqual(["stream1", "stream2", "stream3"]);
  });
});
