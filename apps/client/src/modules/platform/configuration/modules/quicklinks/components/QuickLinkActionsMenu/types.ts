import { ActionMenuType } from "@/k8s/constants/actionMenuTypes";
import { RouteParams } from "@/core/router/types";
import { QuickLink } from "@my-project/shared";

export interface QuickLinkActionsMenuProps {
  data: {
    quickLink: QuickLink;
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
}
