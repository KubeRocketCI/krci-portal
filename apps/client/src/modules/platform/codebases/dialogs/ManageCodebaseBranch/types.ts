import { Codebase, CodebaseBranch } from "@my-project/shared";
import { DialogProps } from "@/core/providers/Dialog/types";

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

// Export the form values type from the schema to ensure type safety
export type { ManageCodebaseBranchFormValues } from "./schema";
