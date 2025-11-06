import { ActionMenuType } from "@/k8s/constants/actionMenuTypes";
import { RouteParams } from "@/core/router/types";
import { PipelineRun } from "@my-project/shared";

export interface PipelineRunActionsMenuProps {
  data: {
    pipelineRun: PipelineRun;
  };
  backRoute?: RouteParams;
  variant?: ActionMenuType;
}
