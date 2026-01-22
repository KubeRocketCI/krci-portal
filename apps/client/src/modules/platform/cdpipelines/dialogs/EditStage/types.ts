import { DialogProps } from "@/core/providers/Dialog/types";
import { Stage } from "@my-project/shared";

export type EditStageDialogProps = DialogProps<{
  stage: Stage;
}>;

/**
 * Form values for editing a Stage
 */
export interface EditStageFormValues {
  triggerType: string;
  triggerTemplate: string;
  cleanTemplate: string;
}
