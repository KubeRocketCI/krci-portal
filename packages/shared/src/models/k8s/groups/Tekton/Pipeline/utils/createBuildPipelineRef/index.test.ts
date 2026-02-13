import { describe, expect, it } from "vitest";
import { createBuildPipelineRef } from "./index.js";

const makeDefaultBranch = (pipelines?: { build?: string; review?: string }) =>
  ({
    spec: { pipelines },
  }) as any;

const makeGitServer = (gitProvider: string) =>
  ({
    spec: { gitProvider },
  }) as any;

const makeCodebase = (buildTool: string, framework: string, type: string, versioningType: string) =>
  ({
    spec: { buildTool, framework, type, versioning: { type: versioningType } },
  }) as any;

describe("createBuildPipelineRef", () => {
  it("should return build pipeline from defaultBranch if available", () => {
    const result = createBuildPipelineRef({
      defaultBranch: makeDefaultBranch({ build: "my-build-pipeline", review: "my-review" }),
      gitServer: makeGitServer("github"),
      codebase: makeCodebase("gradle", "java11", "application", "edp"),
    });

    expect(result).toBe("my-build-pipeline");
  });

  it("should return empty string if defaultBranch has no build pipeline", () => {
    const result = createBuildPipelineRef({
      defaultBranch: makeDefaultBranch(undefined),
      gitServer: makeGitServer("github"),
      codebase: makeCodebase("gradle", "java11", "application", "edp"),
    });

    expect(result).toBe("");
  });

  it("should return empty string if gitServer or codebase is missing", () => {
    expect(
      createBuildPipelineRef({
        defaultBranch: null as any,
        gitServer: null as any,
        codebase: makeCodebase("gradle", "java11", "application", "edp"),
      })
    ).toBe("");

    expect(
      createBuildPipelineRef({
        defaultBranch: null as any,
        gitServer: makeGitServer("github"),
        codebase: null as any,
      })
    ).toBe("");
  });

  it("should construct pipeline ref from gitServer and codebase when no defaultBranch", () => {
    const result = createBuildPipelineRef({
      defaultBranch: null as any,
      gitServer: makeGitServer("github"),
      codebase: makeCodebase("gradle", "java11", "application", "edp"),
    });

    expect(result).toBe("github-gradle-java11-app-build-edp");
  });

  it("should truncate codebase type to 3 characters", () => {
    const result = createBuildPipelineRef({
      defaultBranch: null as any,
      gitServer: makeGitServer("gitlab"),
      codebase: makeCodebase("npm", "react", "library", "default"),
    });

    expect(result).toBe("gitlab-npm-react-lib-build-default");
  });
});
