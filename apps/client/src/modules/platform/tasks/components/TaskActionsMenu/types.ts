import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { Task } from "@my-project/shared";

export interface TaskActionsMenuProps {
  variant: (typeof actionMenuType)[keyof typeof actionMenuType];
  data: {
    task: Task;
  };
}
