import { ActionMenuType } from "@/k8s/constants/actionMenuTypes";
import { CodebaseBranch, Codebase } from "@my-project/shared";

export interface CodebaseBranchActionsProps {
  data: {
    codebase: Codebase;
    codebaseBranch: CodebaseBranch;
    codebaseBranches: CodebaseBranch[];
    defaultBranch: CodebaseBranch;
    pipelines: {
      review: string;
      build: string;
      security: string;
    };
  };
  backRoute?: string;
  variant?: ActionMenuType;
}
