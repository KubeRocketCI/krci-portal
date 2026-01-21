import { v4 as uuidv4 } from "uuid";
import { createSecurityPipelineRunDraft } from "./index.js";
import { Codebase, CodebaseBranch, GitServer } from "../../../../KRCI/index.js";
import { vi, Mock, describe, it, expect } from "vitest";
import { PipelineRun } from "../../types.js";

vi.mock("uuid", () => ({
  v4: vi.fn(),
}));

const MOCKED_UUID = "abcd";
(uuidv4 as Mock).mockReturnValue(MOCKED_UUID);

const mockCodebase = {
  metadata: { name: "test-codebase" },
  spec: {
    gitUrlPath: "/test-repo",
    gitServer: "github",
  },
} as unknown as Codebase;

const mockCodebaseBranch = {
  metadata: {
    name: "test-codebase-main",
  },
  spec: {
    branchName: "main",
    pipelines: {
      security: "github-maven-java17-app-security-edp",
    },
  },
} as unknown as CodebaseBranch;

const mockPipelineRunTemplate = {
  apiVersion: "tekton.dev/v1",
  kind: "PipelineRun",
  metadata: {
    generateName: "security-scan-",
    labels: {},
  },
  spec: {
    params: [
      { name: "git-source-url", value: "placeholder" },
      { name: "git-source-revision", value: "placeholder" },
      { name: "CODEBASE_NAME", value: "placeholder" },
    ],
    pipelineRef: {
      name: "placeholder",
    },
  },
} as unknown as PipelineRun;

const mockGitServer = {
  spec: {
    gitHost: "github.com",
    gitUser: "git",
    sshPort: 22,
  },
} as unknown as GitServer;

describe("createSecurityPipelineRunDraft", () => {
  it("should create valid security pipeline run draft", () => {
    const result = createSecurityPipelineRunDraft({
      codebase: mockCodebase,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    expect(result.metadata.name).toBe(`security-scan-test-codebase-main-${MOCKED_UUID}`);
    expect(result.metadata.generateName).toBeUndefined();
    expect(result.metadata.labels).toEqual({
      "app.edp.epam.com/codebase": "test-codebase",
      "app.edp.epam.com/codebasebranch": "test-codebase-main",
      "app.edp.epam.com/pipelinetype": "security",
    });
    expect(result.spec.pipelineRef?.name).toBe("github-maven-java17-app-security-edp");
  });

  it("should set git-source-url for non-Gerrit providers", () => {
    const result = createSecurityPipelineRunDraft({
      codebase: mockCodebase,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    const gitSourceUrl = result.spec.params?.find((p) => p.name === "git-source-url");
    expect(gitSourceUrl?.value).toBe("git@github.com:test-repo");
  });

  it("should set git-source-url with ssh:// prefix for Gerrit provider", () => {
    const gerritCodebase = {
      ...mockCodebase,
      spec: {
        ...mockCodebase.spec,
        gitServer: "gerrit",
      },
    } as unknown as Codebase;

    const gerritGitServer = {
      spec: {
        gitHost: "gerrit.example.com",
        gitUser: "gerrit-user",
        sshPort: 29418,
      },
    } as unknown as GitServer;

    const result = createSecurityPipelineRunDraft({
      codebase: gerritCodebase,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: gerritGitServer,
    });

    const gitSourceUrl = result.spec.params?.find((p) => p.name === "git-source-url");
    expect(gitSourceUrl?.value).toBe("ssh://gerrit-user@gerrit.example.com:29418/test-repo");
  });

  it("should set git-source-revision to branch name", () => {
    const result = createSecurityPipelineRunDraft({
      codebase: mockCodebase,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    const gitSourceRevision = result.spec.params?.find((p) => p.name === "git-source-revision");
    expect(gitSourceRevision?.value).toBe("main");
  });

  it("should set CODEBASE_NAME param", () => {
    const result = createSecurityPipelineRunDraft({
      codebase: mockCodebase,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    const codebaseName = result.spec.params?.find((p) => p.name === "CODEBASE_NAME");
    expect(codebaseName?.value).toBe("test-codebase");
  });

  it("should handle gitUrlPath without leading slash", () => {
    const codebaseWithoutSlash = {
      ...mockCodebase,
      spec: {
        ...mockCodebase.spec,
        gitUrlPath: "test-repo-no-slash",
      },
    } as unknown as Codebase;

    const result = createSecurityPipelineRunDraft({
      codebase: codebaseWithoutSlash,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    const gitSourceUrl = result.spec.params?.find((p) => p.name === "git-source-url");
    expect(gitSourceUrl?.value).toBe("git@github.com:test-repo-no-slash");
  });

  it("should truncate long branch names in pipeline run name", () => {
    const longBranchCodebaseBranch = {
      metadata: {
        name: "test-codebase-very-long-branch-name-that-exceeds-limit",
      },
      spec: {
        branchName: "very-long-branch-name-that-exceeds-limit",
        pipelines: {
          security: "security-pipeline",
        },
      },
    } as unknown as CodebaseBranch;

    const result = createSecurityPipelineRunDraft({
      codebase: mockCodebase,
      codebaseBranch: longBranchCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    // Name should be truncated but still valid
    expect(result.metadata.name.startsWith("security-scan-")).toBe(true);
    expect(result.metadata.name.endsWith(`-${MOCKED_UUID}`)).toBe(true);
    expect(result.metadata.name.length).toBeLessThanOrEqual(63); // K8s name limit
  });

  it("should not mutate the original template", () => {
    const originalTemplate = structuredClone(mockPipelineRunTemplate);

    createSecurityPipelineRunDraft({
      codebase: mockCodebase,
      codebaseBranch: mockCodebaseBranch,
      pipelineRunTemplate: mockPipelineRunTemplate,
      gitServer: mockGitServer,
    });

    expect(mockPipelineRunTemplate).toEqual(originalTemplate);
  });
});
