import { describe, expect, it } from "vitest";
import { createReviewPipelineRef } from "./index.js";

const makeDefaultBranch = (pipelines?: { build?: string; review?: string }) =>
  ({
    spec: { pipelines },
  }) as any;

const makeGitServer = (gitProvider: string) =>
  ({
    spec: { gitProvider },
  }) as any;

const makeCodebase = (buildTool: string, framework: string, type: string) =>
  ({
    spec: { buildTool, framework, type },
  }) as any;

describe("createReviewPipelineRef", () => {
  it("should return review pipeline from defaultBranch if available", () => {
    const result = createReviewPipelineRef({
      defaultBranch: makeDefaultBranch({ build: "my-build", review: "my-review-pipeline" }),
      gitServer: makeGitServer("github"),
      codebase: makeCodebase("gradle", "java11", "application"),
    });

    expect(result).toBe("my-review-pipeline");
  });

  it("should return empty string if defaultBranch has no review pipeline", () => {
    const result = createReviewPipelineRef({
      defaultBranch: makeDefaultBranch(undefined),
      gitServer: makeGitServer("github"),
      codebase: makeCodebase("gradle", "java11", "application"),
    });

    expect(result).toBe("");
  });

  it("should return empty string if gitServer or codebase is missing", () => {
    expect(
      createReviewPipelineRef({
        defaultBranch: null as any,
        gitServer: null as any,
        codebase: makeCodebase("gradle", "java11", "application"),
      })
    ).toBe("");
  });

  it("should construct pipeline ref from gitServer and codebase when no defaultBranch", () => {
    const result = createReviewPipelineRef({
      defaultBranch: null as any,
      gitServer: makeGitServer("github"),
      codebase: makeCodebase("gradle", "java11", "application"),
    });

    expect(result).toBe("github-gradle-java11-app-review");
  });

  it("should truncate codebase type to 3 characters", () => {
    const result = createReviewPipelineRef({
      defaultBranch: null as any,
      gitServer: makeGitServer("gitlab"),
      codebase: makeCodebase("npm", "react", "autotest"),
    });

    expect(result).toBe("gitlab-npm-react-aut-review");
  });
});
