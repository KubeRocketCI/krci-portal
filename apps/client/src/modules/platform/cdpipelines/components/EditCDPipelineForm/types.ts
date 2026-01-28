import { EDIT_CDPIPELINE_FORM_NAMES } from "./constants";

export { EDIT_CDPIPELINE_FORM_NAMES } from "./constants";

export interface EditCDPipelineFormValues {
  [EDIT_CDPIPELINE_FORM_NAMES.description]: string;
  [EDIT_CDPIPELINE_FORM_NAMES.applications]: string[];
  [EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams]: string[];
  [EDIT_CDPIPELINE_FORM_NAMES.applicationsToPromote]: string[];
  [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser]: string[];
  [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray]: ApplicationFieldArrayItem[];
  [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll]: boolean;
}

export interface ApplicationFieldArrayItem {
  appName: string;
  appBranch: string;
  appToPromote: boolean;
}
