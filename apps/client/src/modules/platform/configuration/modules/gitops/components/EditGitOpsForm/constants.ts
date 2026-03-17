import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const CODEBASE_FORM_NAMES = {
  TYPE: "type",
  STRATEGY: "strategy",
  GIT_SERVER: "gitServer",
  GIT_URL_PATH: "gitUrlPath",
  EMPTY_PROJECT: "emptyProject",
  NAME: "name",
  NAMESPACE: "namespace",
  DESCRIPTION: "description",
  DEFAULT_BRANCH: "defaultBranch",
  LANG: "lang",
  FRAMEWORK: "framework",
  BUILD_TOOL: "buildTool",
  VERSIONING_TYPE: "versioningType",
  VERSIONING_START_FROM: "versioningStartFrom",
  DEPLOYMENT_SCRIPT: "deploymentScript",
  CI_TOOL: "ciTool",
  GIT_REPO_PATH: "gitRepoPath",
  SYSTEM_TYPE_LABEL: "systemTypeLabel",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "gitServer",
      label: "Git Server",
      description: "The Git server where the GitOps repository is hosted.",
    },
    {
      fieldName: "gitRepoPath",
      label: "Git Repository Path",
      description: "The repository path for the GitOps repository.",
      notes: ["This field is hidden when using Gerrit as the Git provider"],
      visibilityHint: "Visible when Git Server provider is not Gerrit",
    },
    {
      fieldName: "name",
      label: "Name",
      description: "The unique identifier for this GitOps repository.",
    },
  ],
};
