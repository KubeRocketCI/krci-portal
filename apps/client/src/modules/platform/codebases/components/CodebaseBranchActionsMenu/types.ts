import { ActionMenuType } from "@/core/k8s/constants/actionMenuTypes";
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
    };
  };
  backRoute?: string;
  variant?: ActionMenuType;
  anchorEl?: HTMLElement | null;
  handleCloseResourceActionListMenu?: () => void;
}
