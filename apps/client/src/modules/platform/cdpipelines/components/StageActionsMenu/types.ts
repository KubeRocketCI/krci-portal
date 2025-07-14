import { ActionMenuType } from "@/core/k8s/constants/actionMenuTypes";
import { RouteParams } from "@/core/router/types";
import { CDPipeline, Stage } from "@my-project/shared";

export interface StageActionsMenuProps {
  data: {
    stage: Stage;
    stages: Stage[];
    cdPipeline: CDPipeline;
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
  anchorEl?: HTMLElement;
  handleCloseResourceActionListMenu?: () => void;
}
