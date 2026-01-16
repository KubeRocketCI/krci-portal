import { describe, expect, it } from "vitest";
import { createCodebaseDraftObject } from "./index.js";
import { ZodError } from "zod";
import { codebaseType } from "../../constants.js";

const baseInput = {
  name: "test",
  gitServer: "gerrit",
  gitUrlPath: "my-repo",
  type: codebaseType.application,
  buildTool: "gradle",
  defaultBranch: "main",
  deploymentScript: "helm-chart",
  emptyProject: true,
  framework: "java11",
  lang: "Java",
  private: false,
  repositoryUrl: "https://git.url/repo.git",
  strategy: "create",
  versioningType: "edp",
  versioningStartFrom: "0.0.0-SNAPSHOT",
  ciTool: "tekton",
  labels: {
    "app.edp.epam.com/codebaseType": codebaseType.application,
  },
} as const;

describe("K8sCodebase: createCodebaseDraft", () => {
  it("should create valid application codebase", () => {
    const result = createCodebaseDraftObject({
      ...baseInput,
      type: codebaseType.application,
    });

    expect(result).toMatchObject({
      apiVersion: "v2.edp.epam.com/v1",
      kind: "Codebase",
      metadata: {
        name: "test",
        labels: { "app.edp.epam.com/codebaseType": "application" },
      },
      spec: {
        gitUrlPath: "/my-repo", // normalized
        type: "application",
      },
    });
  });

  it("should normalize gitUrlPath to start with slash", () => {
    const result = createCodebaseDraftObject({
      ...baseInput,
      gitUrlPath: "some-path",
    });

    expect(result.spec.gitUrlPath).toBe("/some-path");
  });

  it("should accept gitUrlPath already starting with slash", () => {
    const result = createCodebaseDraftObject({
      ...baseInput,
      gitUrlPath: "/some-path",
    });

    expect(result.spec.gitUrlPath).toBe("/some-path");
  });

  it("should throw ZodError on missing required fields", () => {
    expect(() =>
      createCodebaseDraftObject({
        name: "bad",
      } as any)
    ).toThrowError(ZodError);
  });

  it("should throw ZodError on invalid types", () => {
    expect(() =>
      createCodebaseDraftObject({
        ...baseInput,
        gitServer: null as never, // invalid type
      })
    ).toThrowError(ZodError);
  });

  it("should create a library codebase", () => {
    const result = createCodebaseDraftObject({
      ...baseInput,
      type: codebaseType.library,
      labels: {
        "app.edp.epam.com/codebaseType": codebaseType.library,
      },
    });

    expect(result.spec.type).toBe("library");
  });

  it("should create an autotest codebase", () => {
    const result = createCodebaseDraftObject({
      ...baseInput,
      type: codebaseType.autotest,
      labels: {
        "app.edp.epam.com/codebaseType": codebaseType.autotest,
      },
    });

    expect(result.spec.type).toBe("autotest");
  });
});
