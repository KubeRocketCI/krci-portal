import { Codebase, CodebaseBranch } from "@my-project/shared";
import { DialogProps } from "@/core/providers/Dialog/types";

export type ManageCodebaseBranchDialogProps = DialogProps<{
  codebaseBranches: CodebaseBranch[];
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
  pipelines: {
    review: string;
    build: string;
  };
  codebaseBranch?: CodebaseBranch;
}>;

const NAMES = {
  NAME: "name",
  FROM_COMMIT: "fromCommit",
  RELEASE: "release",
  VERSION: "version",
  CODEBASE_NAME_LABEL: "codebaseNameLabel",
  BUILD_PIPELINE: "buildPipeline",
  REVIEW_PIPELINE: "reviewPipeline",

  // NON RELEASE RELATED FIELDS
  BRANCH_NAME: "branchName",

  // RELEASE RELATED FIELDS
  RELEASE_BRANCH_NAME: "releaseBranchName",
  RELEASE_BRANCH_VERSION_START: "releaseBranchVersionStart",
  RELEASE_BRANCH_VERSION_POSTFIX: "releaseBranchVersionPostfix",
  DEFAULT_BRANCH_VERSION_START: "defaultBranchVersionStart",
  DEFAULT_BRANCH_VERSION_POSTFIX: "defaultBranchVersionPostfix",

  // NOT USED IN RESOURCE DATA
  CODEBASE_NAME: "codebaseName",
} as const;

export type ManageCodebaseBranchFormValues = {
  [NAMES.NAME]: string;
  [NAMES.FROM_COMMIT]: string;
  [NAMES.RELEASE]: boolean;
  [NAMES.VERSION]: string;
  [NAMES.CODEBASE_NAME_LABEL]: string;
  [NAMES.BUILD_PIPELINE]: string;
  [NAMES.REVIEW_PIPELINE]: string;
  [NAMES.BRANCH_NAME]: string;
  [NAMES.RELEASE_BRANCH_NAME]: string;
  [NAMES.RELEASE_BRANCH_VERSION_START]: string;
  [NAMES.RELEASE_BRANCH_VERSION_POSTFIX]: string;
  [NAMES.DEFAULT_BRANCH_VERSION_START]: string;
  [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX]: string;
  [NAMES.CODEBASE_NAME]: string;
};
