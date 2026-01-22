import { Codebase, CodebaseBranch } from "@my-project/shared";
import { DialogProps } from "@/core/providers/Dialog/types";
import { NAMES } from "./names";

export type ManageCodebaseBranchDialogProps = DialogProps<{
  codebaseBranches: CodebaseBranch[];
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
  pipelines: {
    review: string;
    build: string;
    security: string;
  };
  codebaseBranch?: CodebaseBranch;
  isProtected?: boolean;
}>;

export type ManageCodebaseBranchFormValues = {
  [NAMES.NAME]: string;
  [NAMES.FROM_COMMIT]: string;
  [NAMES.FROM_TYPE]: string;
  [NAMES.RELEASE]: boolean;
  [NAMES.VERSION]: string;
  [NAMES.CODEBASE_NAME_LABEL]: string;
  [NAMES.BUILD_PIPELINE]: string;
  [NAMES.REVIEW_PIPELINE]: string;
  [NAMES.SECURITY_PIPELINE]: string;
  [NAMES.BRANCH_NAME]: string;
  [NAMES.RELEASE_BRANCH_NAME]: string;
  [NAMES.RELEASE_BRANCH_VERSION_START]: string;
  [NAMES.RELEASE_BRANCH_VERSION_POSTFIX]: string;
  [NAMES.DEFAULT_BRANCH_VERSION_START]: string;
  [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX]: string;
  [NAMES.CODEBASE_NAME]: string;
};
