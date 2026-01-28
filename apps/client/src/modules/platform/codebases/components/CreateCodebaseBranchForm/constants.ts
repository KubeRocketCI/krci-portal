import { BackwardNameMapping } from "@/core/types/forms";
import { codebaseBranchLabels } from "@my-project/shared";

export const RELEASE_BRANCH_POSTFIX = "RC";

export const NAMES = {
  NAME: "name",
  FROM_COMMIT: "fromCommit",
  FROM_TYPE: "fromType",
  RELEASE: "release",
  VERSION: "version",
  CODEBASE_NAME_LABEL: "codebaseNameLabel",
  BUILD_PIPELINE: "buildPipeline",
  REVIEW_PIPELINE: "reviewPipeline",
  SECURITY_PIPELINE: "securityPipeline",

  BRANCH_NAME: "branchName",

  RELEASE_BRANCH_NAME: "releaseBranchName",
  RELEASE_BRANCH_VERSION_START: "releaseBranchVersionStart",
  RELEASE_BRANCH_VERSION_POSTFIX: "releaseBranchVersionPostfix",
  DEFAULT_BRANCH_VERSION_START: "defaultBranchVersionStart",
  DEFAULT_BRANCH_VERSION_POSTFIX: "defaultBranchVersionPostfix",

  CODEBASE_NAME: "codebaseName",
} as const;

export const CODEBASE_BRANCH_FORM_NAMES = {
  [NAMES.NAME]: {
    name: NAMES.NAME,
    path: ["metadata", "name"],
  },
  [NAMES.BRANCH_NAME]: {
    name: NAMES.BRANCH_NAME,
    path: ["spec", "branchName"],
  },
  [NAMES.RELEASE_BRANCH_NAME]: {
    name: NAMES.RELEASE_BRANCH_NAME,
    path: ["spec", "branchName"],
  },
  [NAMES.FROM_COMMIT]: {
    name: NAMES.FROM_COMMIT,
    path: ["spec", "fromCommit"],
  },
  [NAMES.FROM_TYPE]: {
    name: NAMES.FROM_TYPE,
    notUsedInFormData: true,
  },
  [NAMES.RELEASE]: {
    name: NAMES.RELEASE,
    path: ["spec", "release"],
  },
  [NAMES.VERSION]: {
    name: NAMES.VERSION,
    path: ["spec", "version"],
  },
  [NAMES.BUILD_PIPELINE]: {
    name: NAMES.BUILD_PIPELINE,
    path: ["spec", "pipelines", "build"],
  },
  [NAMES.REVIEW_PIPELINE]: {
    name: NAMES.REVIEW_PIPELINE,
    path: ["spec", "pipelines", "review"],
  },
  [NAMES.SECURITY_PIPELINE]: {
    name: NAMES.SECURITY_PIPELINE,
    path: ["spec", "pipelines", "security"],
  },
  [NAMES.CODEBASE_NAME_LABEL]: {
    name: NAMES.CODEBASE_NAME_LABEL,
    path: ["metadata", "labels", codebaseBranchLabels.codebase],
  },

  [NAMES.RELEASE_BRANCH_VERSION_START]: {
    name: NAMES.RELEASE_BRANCH_VERSION_START,
    notUsedInFormData: true,
  },
  [NAMES.RELEASE_BRANCH_VERSION_POSTFIX]: {
    name: NAMES.RELEASE_BRANCH_VERSION_POSTFIX,
    notUsedInFormData: true,
  },
  [NAMES.DEFAULT_BRANCH_VERSION_START]: {
    name: NAMES.DEFAULT_BRANCH_VERSION_START,
    notUsedInFormData: true,
  },
  [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX]: {
    name: NAMES.DEFAULT_BRANCH_VERSION_POSTFIX,
    notUsedInFormData: true,
  },
  [NAMES.CODEBASE_NAME]: {
    name: NAMES.CODEBASE_NAME,
    path: ["spec", "codebaseName"],
    notUsedInFormData: true,
  },
};

export const CODEBASE_BRANCH_BACKWARDS_FIELD_MAPPING: BackwardNameMapping = {
  labels: {
    children: {
      [codebaseBranchLabels.codebase]: {
        formItemName: NAMES.CODEBASE_NAME_LABEL,
      },
    },
  },
};
