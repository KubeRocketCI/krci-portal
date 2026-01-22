import { CDPipeline } from "@my-project/shared";

/**
 * Form values for editing a CD Pipeline
 */
export interface EditCDPipelineFormValues {
  description: string;
  applications: string[];
  inputDockerStreams: string[];
  applicationsToPromote: string[];
  ui_applicationsToAddChooser: string[];
  ui_applicationsFieldArray: ApplicationFieldArrayItem[];
  ui_applicationsToPromoteAll: boolean;
}

/**
 * Application field array item type
 */
export interface ApplicationFieldArrayItem {
  appName: string;
  appBranch: string;
  appToPromote: boolean;
}

/**
 * Dialog props type
 */
export interface EditCDPipelineDialogProps {
  props: {
    CDPipeline: CDPipeline;
  };
  state: {
    open: boolean;
    closeDialog: () => void;
  };
}
