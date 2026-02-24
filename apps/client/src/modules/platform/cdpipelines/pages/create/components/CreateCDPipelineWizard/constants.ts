import { ValueOf } from "@/core/types/global";
import type { FormGuideFieldDescription, FormGuideStep } from "@/core/providers/FormGuide/types";

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

export const WIZARD_GUIDE_STEPS: FormGuideStep[] = [
  { id: 1, label: "Applications", sublabel: "Select applications" },
  { id: 2, label: "Pipeline Configuration", sublabel: "Configure pipeline settings" },
];

export const HELP_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  1: [
    {
      fieldName: "applications",
      label: "Applications",
      description: "Select one or more applications (codebases) to include in this deployment pipeline.",
      notes: ["Each application needs a branch selected — this determines which image stream tag is deployed."],
    },
  ],
  2: [
    {
      fieldName: "name",
      label: "Pipeline Name",
      description:
        "A unique name for this deployment pipeline (2–15 characters, lowercase letters, numbers, and dashes).",
      notes: ["Used in namespace names and Kubernetes resource labels."],
    },
    {
      fieldName: "description",
      label: "Description",
      description: "A short summary shown in the deployment list to help your team identify this pipeline.",
    },
    {
      fieldName: "deploymentType",
      label: "Deployment Type",
      description: "How applications in this pipeline are deployed.",
      notes: ["Container — deploy as container images to Kubernetes.", "Custom — use a custom deployment approach."],
    },
    {
      fieldName: "applicationsToPromote",
      label: "Promote Applications",
      description: "Choose which applications should be automatically promoted between environments.",
    },
  ],
};
