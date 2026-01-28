import { ActionMenuType } from "@/k8s/constants/actionMenuTypes";
import { RouteParams } from "@/core/router/types";
import { Stage } from "@my-project/shared";

export interface StageActionsMenuProps {
  data: {
    stage: Stage;
    stages: Stage[];
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
}
