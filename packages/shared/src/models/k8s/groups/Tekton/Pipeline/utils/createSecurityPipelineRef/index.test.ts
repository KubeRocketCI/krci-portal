import { describe, it, expect } from "vitest";
import { createSecurityPipelineRef } from "./index.js";
import { Codebase, CodebaseBranch, GitServer } from "../../../../KRCI/index.js";

describe("createSecurityPipelineRef", () => {
  const mockCodebase = {
    spec: {
      buildTool: "maven",
      framework: "java17",
      type: "application",
      versioning: {
        type: "edp",
      },
    },
  } as unknown as Codebase;

  const mockGitServer = {
    spec: {
      gitProvider: "github",
    },
  } as unknown as GitServer;

  it("should return security pipeline from defaultBranch when it exists", () => {
    const defaultBranch = {
      spec: {
        pipelines: {
          security: "my-custom-security-pipeline",
        },
      },
    } as unknown as CodebaseBranch;

    const result = createSecurityPipelineRef({
      defaultBranch,
      gitServer: mockGitServer,
      codebase: mockCodebase,
    });

    expect(result).toBe("my-custom-security-pipeline");
  });

  it("should return empty string when defaultBranch exists but has no security pipeline", () => {
    const defaultBranch = {
      spec: {
        pipelines: {
          build: "some-build-pipeline",
          review: "some-review-pipeline",
        },
      },
    } as unknown as CodebaseBranch;

    const result = createSecurityPipelineRef({
      defaultBranch,
      gitServer: mockGitServer,
      codebase: mockCodebase,
    });

    expect(result).toBe("");
  });

  it("should return empty string when gitServer is missing", () => {
    const result = createSecurityPipelineRef({
      defaultBranch: undefined as unknown as CodebaseBranch,
      gitServer: undefined as unknown as GitServer,
      codebase: mockCodebase,
    });

    expect(result).toBe("");
  });

  it("should return empty string when codebase is missing", () => {
    const result = createSecurityPipelineRef({
      defaultBranch: undefined as unknown as CodebaseBranch,
      gitServer: mockGitServer,
      codebase: undefined as unknown as Codebase,
    });

    expect(result).toBe("");
  });

  it("should construct pipeline name from codebase and gitServer properties", () => {
    const result = createSecurityPipelineRef({
      defaultBranch: undefined as unknown as CodebaseBranch,
      gitServer: mockGitServer,
      codebase: mockCodebase,
    });

    expect(result).toBe("github-maven-java17-app-security-edp");
  });

  it("should truncate codebase type to 3 characters", () => {
    const codebaseWithLongType = {
      spec: {
        buildTool: "npm",
        framework: "react",
        type: "library",
        versioning: {
          type: "default",
        },
      },
    } as unknown as Codebase;

    const result = createSecurityPipelineRef({
      defaultBranch: undefined as unknown as CodebaseBranch,
      gitServer: mockGitServer,
      codebase: codebaseWithLongType,
    });

    expect(result).toBe("github-npm-react-lib-security-default");
  });

  it("should work with different git providers", () => {
    const gitlabServer = {
      spec: {
        gitProvider: "gitlab",
      },
    } as unknown as GitServer;

    const result = createSecurityPipelineRef({
      defaultBranch: undefined as unknown as CodebaseBranch,
      gitServer: gitlabServer,
      codebase: mockCodebase,
    });

    expect(result).toBe("gitlab-maven-java17-app-security-edp");
  });

  it("should work with autotest type (truncated to aut)", () => {
    const autotestCodebase = {
      spec: {
        buildTool: "gradle",
        framework: "java11",
        type: "autotest",
        versioning: {
          type: "edp",
        },
      },
    } as unknown as Codebase;

    const result = createSecurityPipelineRef({
      defaultBranch: undefined as unknown as CodebaseBranch,
      gitServer: mockGitServer,
      codebase: autotestCodebase,
    });

    expect(result).toBe("github-gradle-java11-aut-security-edp");
  });
});
