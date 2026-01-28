import { DialogProps } from "@/core/providers/Dialog/types";
import { CodebaseBranch } from "@my-project/shared";

export type EditCodebaseBranchDialogProps = DialogProps<{
  codebaseBranch: CodebaseBranch;
  isProtected?: boolean;
}>;
