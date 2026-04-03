import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const GIT_OPS_CODEBASE_NAME = "krci-gitops";

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
  UI_GIT_SERVER_PROVIDER: "ui_gitServerProvider",
  UI_REPOSITORY_OWNER: "ui_repositoryOwner",
  UI_REPOSITORY_NAME: "ui_repositoryName",
  SYSTEM_TYPE_LABEL: "systemTypeLabel",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "strategy",
      label: "Strategy",
      description:
        "Select whether to create a new GitOps repository or import an existing one. Create generates a new repository, while Import onboards your existing repository.",
    },
    {
      fieldName: "gitServer",
      label: "Git Server",
      description:
        "Select the Git server where your GitOps repository will be hosted. The Git server must be configured before creating a GitOps repository.",
    },
    {
      fieldName: "ciTool",
      label: "CI Tool",
      description:
        "Select the Continuous Integration tool to use for this GitOps repository. This determines how your GitOps changes will be processed.",
    },
    {
      fieldName: "gitUrlPath",
      label: "Git URL Path",
      description: "Enter the Gerrit repository path for the GitOps repository.",
      notes: ["This field is visible only when using Gerrit as the Git provider"],
      visibilityHint: "Visible when Git Server provider is Gerrit",
    },
    {
      fieldName: "ui_repositoryOwner",
      label: "Owner",
      description: "Select the organization or account that owns the GitOps repository.",
      notes: ["This field is hidden when using Gerrit as the Git provider"],
      visibilityHint: "Visible when Git Server provider is not Gerrit",
    },
    {
      fieldName: "ui_repositoryName",
      label: "Repository",
      description: "Select or enter the repository name for the GitOps repository.",
      notes: ["This field is hidden when using Gerrit as the Git provider"],
      visibilityHint: "Visible when Git Server provider is not Gerrit",
    },
    {
      fieldName: "name",
      label: "Name",
      description: "A unique identifier for this GitOps repository. This name will be used internally by the platform.",
    },
  ],
};
