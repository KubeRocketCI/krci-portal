export const CODEBASE_FROM_TEMPLATE_FORM_NAMES = {
  NAME: "name",
  DESCRIPTION: "description",
  LANG: "lang",
  FRAMEWORK: "framework",
  BUILD_TOOL: "buildTool",
  STRATEGY: "strategy",
  TYPE: "type",
  VERSIONING_TYPE: "versioningType",
  VERSIONING_START_FROM: "versioningStartFrom",
  CI_TOOL: "ciTool",
  REPOSITORY_URL: "repositoryUrl",
  GIT_SERVER: "gitServer",
  GIT_URL_PATH: "gitUrlPath",
  DEFAULT_BRANCH: "defaultBranch",
  EMPTY_PROJECT: "emptyProject",
  PRIVATE: "private",

  // NOT USED IN RESOURCE DATA
  VERSIONING_START_FROM_VERSION: "versioningStartFromVersion",
  VERSIONING_START_FROM_POSTFIX: "versioningStartFromPostfix",
} as const;
