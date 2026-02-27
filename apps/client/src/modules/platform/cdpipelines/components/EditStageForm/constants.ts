import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const EDIT_STAGE_FORM_NAMES = {
  triggerType: "triggerType",
  triggerTemplate: "triggerTemplate",
  cleanTemplate: "cleanTemplate",
  qualityGates: "qualityGates",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "triggerType",
      label: "Trigger Type",
      description: "How deployments to this environment are initiated.",
      notes: [
        "Auto — deploy automatically after the previous environment succeeds.",
        "Manual — require a manual approval before deploying.",
        "Auto-stable — deploy automatically only when all quality gates pass.",
      ],
    },
    {
      fieldName: "triggerTemplate",
      label: "Deploy Pipeline Template",
      description: "The pipeline template used to deploy applications to this environment.",
    },
    {
      fieldName: "cleanTemplate",
      label: "Clean Pipeline Template",
      description: "The pipeline template used to tear down or clean this environment.",
    },
    {
      fieldName: "qualityGates",
      label: "Quality Gates",
      description: "Checks that must pass before a deployment is promoted to the next environment.",
      notes: [
        "Manual — requires a human to approve the deployment.",
        "Autotests — runs an autotest suite; select the codebase and branch to run.",
        "At least one quality gate is required.",
      ],
    },
  ],
};
