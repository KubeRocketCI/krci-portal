import { EDIT_STAGE_FORM_NAMES } from "./constants";

export { EDIT_STAGE_FORM_NAMES } from "./constants";

export type QualityGate = {
  id: string;
  qualityGateType: "manual" | "autotests";
  stepName: string;
  autotestName: string | null;
  branchName: string | null;
};

/**
 * Form values for editing a Stage
 */
export interface EditStageFormValues {
  [EDIT_STAGE_FORM_NAMES.triggerType]: string;
  [EDIT_STAGE_FORM_NAMES.triggerTemplate]: string;
  [EDIT_STAGE_FORM_NAMES.cleanTemplate]: string;
  [EDIT_STAGE_FORM_NAMES.qualityGates]: QualityGate[];
}
