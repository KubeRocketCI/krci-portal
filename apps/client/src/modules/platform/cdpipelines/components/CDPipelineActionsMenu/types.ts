import { ActionMenuType } from "@/core/k8s/constants/actionMenuTypes";
import { RouteParams } from "@/core/router/types";
import { CDPipeline } from "@my-project/shared";

export interface CDPipelineActionsMenuProps {
  data: {
    CDPipeline: CDPipeline;
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
  anchorEl?: HTMLElement;
  handleCloseResourceActionListMenu?: () => void;
}
