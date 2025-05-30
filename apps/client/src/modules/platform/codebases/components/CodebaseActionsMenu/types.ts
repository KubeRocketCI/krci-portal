import { ActionMenuType } from "@/core/k8s/constants/actionMenuTypes";
import { RouterPaths } from "@/core/router/types";
import { Codebase } from "@my-project/shared";

export interface CodebaseActionsMenuProps {
  data: {
    codebase: Codebase;
  };
  backRoute?: RouterPaths;
  variant?: ActionMenuType;
  anchorEl?: HTMLElement;
  handleCloseResourceActionListMenu?: () => void;
}
