import { Pipeline } from "@my-project/shared";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";

export interface PipelineActionsMenuProps {
  variant: (typeof actionMenuType)[keyof typeof actionMenuType];
  data: {
    pipeline: Pipeline;
  };
}
