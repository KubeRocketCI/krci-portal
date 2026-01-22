import z from "zod";
import { createCDPipelineFormSchema, NAMES, FORM_PARTS } from "./names";

// ============================================================================
// FORM VALUES TYPE
// ============================================================================

export type CreateCDPipelineFormValues = z.infer<typeof createCDPipelineFormSchema>;

// ============================================================================
// FORM FIELD NAMES
// ============================================================================

export const CREATE_CDPIPELINE_FORM_NAMES = {
  // Core fields
  name: { name: NAMES.name as typeof NAMES.name, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
  description: { name: NAMES.description as typeof NAMES.description, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
  deploymentType: {
    name: NAMES.deploymentType as typeof NAMES.deploymentType,
    formPart: FORM_PARTS.PIPELINE_CONFIGURATION,
  },
  applications: { name: NAMES.applications as typeof NAMES.applications, formPart: FORM_PARTS.APPLICATIONS },
  inputDockerStreams: {
    name: NAMES.inputDockerStreams as typeof NAMES.inputDockerStreams,
    formPart: FORM_PARTS.APPLICATIONS,
  },
  applicationsToPromote: {
    name: NAMES.applicationsToPromote as typeof NAMES.applicationsToPromote,
    formPart: FORM_PARTS.PIPELINE_CONFIGURATION,
  },

  // UI-only fields
  ui_applicationsToAddChooser: {
    name: NAMES.ui_applicationsToAddChooser as typeof NAMES.ui_applicationsToAddChooser,
    formPart: FORM_PARTS.APPLICATIONS,
  },
  ui_applicationsFieldArray: {
    name: NAMES.ui_applicationsFieldArray as typeof NAMES.ui_applicationsFieldArray,
    formPart: FORM_PARTS.APPLICATIONS,
  },
  ui_applicationsToPromoteAll: {
    name: NAMES.ui_applicationsToPromoteAll as typeof NAMES.ui_applicationsToPromoteAll,
    formPart: FORM_PARTS.PIPELINE_CONFIGURATION,
  },
} as const;

// Application field array item type
export type ApplicationFieldArrayItem = {
  appName: string;
  appBranch: string;
  appToPromote: boolean;
};
