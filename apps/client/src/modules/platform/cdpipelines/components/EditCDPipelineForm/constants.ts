import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const EDIT_CDPIPELINE_FORM_NAMES = {
  description: "description",
  applications: "applications",
  inputDockerStreams: "inputDockerStreams",
  applicationsToPromote: "applicationsToPromote",
  ui_applicationsToAddChooser: "ui_applicationsToAddChooser",
  ui_applicationsFieldArray: "ui_applicationsFieldArray",
  ui_applicationsToPromoteAll: "ui_applicationsToPromoteAll",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "applications",
      label: "Applications",
      description:
        "The applications (codebases) included in this deployment pipeline. Add or remove applications and select branches.",
    },
    {
      fieldName: "description",
      label: "Description",
      description: "A short summary shown in the deployment list to help your team identify this pipeline.",
    },
    {
      fieldName: "applicationsToPromote",
      label: "Promote Applications",
      description: "Choose which applications should be automatically promoted between environments.",
    },
  ],
};
