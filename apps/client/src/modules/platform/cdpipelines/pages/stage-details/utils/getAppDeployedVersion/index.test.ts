import { describe, expect, it } from "vitest";
import { Application, Codebase } from "@my-project/shared";
import { getAppDeployedVersion } from "./index.js";

const helmCodebase = {
  spec: { lang: "helm", framework: "helm", buildTool: "helm" },
} as unknown as Codebase;

const dockerCodebase = {
  spec: { lang: "java", framework: "spring-boot", buildTool: "maven" },
} as unknown as Codebase;

describe("getAppDeployedVersion", () => {
  it("returns 'NaN' when application is undefined", () => {
    expect(getAppDeployedVersion(dockerCodebase, undefined)).toBe("NaN");
    expect(getAppDeployedVersion(helmCodebase, undefined)).toBe("NaN");
  });

  it("reads targetRevision for a Helm codebase without a values override", () => {
    const application = {
      spec: {
        source: { targetRevision: "charts/2.0.0", helm: { parameters: [] } },
      },
    } as unknown as Application;

    expect(getAppDeployedVersion(helmCodebase, application)).toBe("2.0.0");
  });

  it("reads the image.tag helm parameter for a non-Helm codebase without a values override", () => {
    const application = {
      spec: {
        source: { helm: { parameters: [{ name: "image.tag", value: "v3.0.0" }] } },
      },
    } as unknown as Application;

    expect(getAppDeployedVersion(dockerCodebase, application)).toBe("v3.0.0");
  });

  it("reads from the matching helm source when the application has a values override", () => {
    const application = {
      spec: {
        sources: [{ helm: { parameters: [{ name: "image.tag", value: "v1.0.0" }] }, targetRevision: "main" }],
      },
    } as unknown as Application;

    expect(getAppDeployedVersion(dockerCodebase, application)).toBe("v1.0.0");
  });

  it("does not throw for a just-created application whose spec is not populated yet", () => {
    const bareApplication = {} as unknown as Application;

    expect(() => getAppDeployedVersion(dockerCodebase, bareApplication)).not.toThrow();
    expect(getAppDeployedVersion(dockerCodebase, bareApplication)).toBe("");
    expect(getAppDeployedVersion(helmCodebase, bareApplication)).toBe("");
  });
});
