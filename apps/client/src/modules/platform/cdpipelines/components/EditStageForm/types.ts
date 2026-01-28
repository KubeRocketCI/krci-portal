import { EDIT_STAGE_FORM_NAMES } from "./constants";

export { EDIT_STAGE_FORM_NAMES } from "./constants";

/**
 * Form values for editing a Stage
 */
export interface EditStageFormValues {
  [EDIT_STAGE_FORM_NAMES.triggerType]: string;
  [EDIT_STAGE_FORM_NAMES.triggerTemplate]: string;
  [EDIT_STAGE_FORM_NAMES.cleanTemplate]: string;
}
