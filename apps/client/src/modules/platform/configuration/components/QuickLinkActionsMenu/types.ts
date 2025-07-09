import { QuickLink } from "@my-project/shared";
import { RouteParams } from "@/core/router/types";
import { ActionMenuType } from "@/core/k8s/constants/actionMenuTypes";

export interface QuickLinkActionsMenuProps {
  data: {
    quickLink: QuickLink;
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
  anchorEl: HTMLElement | null;
  handleCloseResourceActionListMenu?: () => void;
}
