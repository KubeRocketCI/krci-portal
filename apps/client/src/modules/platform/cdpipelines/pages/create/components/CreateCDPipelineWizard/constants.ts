import { ValueOf } from "@/core/types/global";

export const NAMES = {
  name: "name",
  description: "description",
  deploymentType: "deploymentType",
  applications: "applications",
  inputDockerStreams: "inputDockerStreams",
  applicationsToPromote: "applicationsToPromote",
  ui_applicationsToAddChooser: "ui_applicationsToAddChooser",
  ui_applicationsFieldArray: "ui_applicationsFieldArray",
  ui_applicationsToPromoteAll: "ui_applicationsToPromoteAll",
} as const;

export const FORM_PARTS = {
  APPLICATIONS: "applications",
  PIPELINE_CONFIGURATION: "pipelineConfiguration",
} as const;

export type FormPart = ValueOf<typeof FORM_PARTS>;

export const CREATE_FORM_PARTS = {
  [FORM_PARTS.APPLICATIONS]: [
    NAMES.applications,
    NAMES.ui_applicationsToAddChooser,
    NAMES.ui_applicationsFieldArray,
    NAMES.inputDockerStreams,
  ],
  [FORM_PARTS.PIPELINE_CONFIGURATION]: [
    NAMES.name,
    NAMES.description,
    NAMES.deploymentType,
    NAMES.applicationsToPromote,
    NAMES.ui_applicationsToPromoteAll,
  ],
} as const;

export const CREATE_CDPIPELINE_FORM_NAMES = {
  name: { name: NAMES.name, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
  description: { name: NAMES.description, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
  deploymentType: { name: NAMES.deploymentType, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
  applications: { name: NAMES.applications, formPart: FORM_PARTS.APPLICATIONS },
  inputDockerStreams: { name: NAMES.inputDockerStreams, formPart: FORM_PARTS.APPLICATIONS },
  applicationsToPromote: { name: NAMES.applicationsToPromote, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
  ui_applicationsToAddChooser: { name: NAMES.ui_applicationsToAddChooser, formPart: FORM_PARTS.APPLICATIONS },
  ui_applicationsFieldArray: { name: NAMES.ui_applicationsFieldArray, formPart: FORM_PARTS.APPLICATIONS },
  ui_applicationsToPromoteAll: { name: NAMES.ui_applicationsToPromoteAll, formPart: FORM_PARTS.PIPELINE_CONFIGURATION },
} as const;
