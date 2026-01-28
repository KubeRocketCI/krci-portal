import { ActionMenuType } from "@/k8s/constants/actionMenuTypes";
import { CodebaseBranch, Codebase } from "@my-project/shared";

export interface CodebaseBranchActionsProps {
  data: {
    codebase: Codebase;
    codebaseBranch: CodebaseBranch;
  };
  backRoute?: string;
  variant?: ActionMenuType;
}
