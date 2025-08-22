import { ActionMenuType } from "@/k8s/constants/actionMenuTypes";
import { RouteParams } from "@/core/router/types";
import { Codebase } from "@my-project/shared";

export interface CodebaseActionsMenuProps {
  data: {
    codebase: Codebase;
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
  anchorEl?: HTMLElement;
  handleCloseResourceActionListMenu?: () => void;
}
