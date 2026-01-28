import { DialogProps } from "@/core/providers/Dialog/types";
import { Codebase, CodebaseBranch } from "@my-project/shared";

export type CreateCodebaseBranchDialogProps = DialogProps<{
  codebaseBranches: CodebaseBranch[];
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
  pipelines: {
    review?: string;
    build?: string;
    security?: string;
  };
}>;
