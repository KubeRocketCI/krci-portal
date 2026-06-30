import { describe, it, expect } from "vitest";
import { codebaseCreationStrategy, codebaseType, gitProvider } from "@my-project/shared";
import { createCodebaseFormSchema } from "./schema";

// A fully-populated form value (all steps) so the schema's superRefine runs.
const completeValues = {
  ui_creationMethod: "custom",
  type: codebaseType.application,
  strategy: codebaseCreationStrategy.create,
  gitServer: "my-gerrit-server", // intentionally NOT named "gerrit"
  ui_gitServerProvider: gitProvider.gerrit,
  gitUrlPath: "team/repo",
  ui_repositoryOwner: "",
  ui_repositoryName: "",
  defaultBranch: "main",
  name: "my-app",
  description: "desc",
  private: true,
  emptyProject: false,
  ui_hasCodebaseAuth: false,
  ui_hasJiraServerIntegration: false,
  lang: "java",
  framework: "java17",
  buildTool: "maven",
  versioningType: "default",
  ciTool: "tekton",
  deploymentScript: "helm-chart",
  repositoryUrl: null,
  versioningStartFrom: "0.1.0-SNAPSHOT",
  commitMessagePattern: "",
};

const paths = (values: unknown): string[] => {
  const r = createCodebaseFormSchema.safeParse(values);
  return r.success ? [] : r.error.errors.map((e) => String(e.path[0]));
};

describe("createCodebaseFormSchema Git server detection", () => {
  it("validates the Gerrit branch based on provider, not the git server name", () => {
    // ui_gitServerProvider=gerrit -> validate gitUrlPath, ignore owner/repo even though the
    // git server is named "my-gerrit-server" (the old name-based check would have failed).
    const errs = paths({ ...completeValues, gitUrlPath: "ab" });
    expect(errs).toContain("gitUrlPath");
    expect(errs).not.toContain("ui_repositoryOwner");
    expect(errs).not.toContain("ui_repositoryName");
  });

  it("accepts a valid Gerrit path and does not require owner/repository", () => {
    expect(paths(completeValues)).toEqual([]);
  });

  it("validates the non-Gerrit branch (owner/repository) when provider is GitHub", () => {
    const errs = paths({ ...completeValues, ui_gitServerProvider: gitProvider.github });
    expect(errs).toContain("ui_repositoryOwner");
    expect(errs).toContain("ui_repositoryName");
    expect(errs).not.toContain("gitUrlPath");
  });
});
