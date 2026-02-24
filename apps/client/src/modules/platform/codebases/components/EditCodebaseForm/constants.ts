import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const EDIT_CODEBASE_FORM_NAMES = {
  commitMessagePattern: "commitMessagePattern",
  hasJiraServerIntegration: "hasJiraServerIntegration",
  jiraServer: "jiraServer",
  ticketNamePattern: "ticketNamePattern",
  advancedMappingFieldName: "advancedMappingFieldName",
  advancedMappingRows: "advancedMappingRows",
  jiraIssueMetadataPayload: "jiraIssueMetadataPayload",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "commitMessagePattern",
      label: "Commit Message Pattern",
      description:
        "A regex pattern that every commit message must match. Helps keep commit history clean and consistent.",
    },
    {
      fieldName: "hasJiraServerIntegration",
      label: "Integrate with Jira Server",
      description: "Connect this project to Jira so commits and builds can be linked to issues.",
    },
    {
      fieldName: "jiraServer",
      label: "Jira Server",
      description: "Pick the Jira server instance to link with this project.",
      visibilityHint: "Shown when Jira integration is enabled",
    },
    {
      fieldName: "ticketNamePattern",
      label: "Ticket Name Pattern",
      description: "A regex pattern to automatically find Jira ticket IDs in your commit messages.",
      visibilityHint: "Shown when Jira integration is enabled",
    },
    {
      fieldName: "advancedMappingFieldName",
      label: "Mapping Field Name",
      description: "Choose which Jira field receives metadata from the platform when a build completes.",
      visibilityHint: "Shown when Jira integration is enabled",
      notes: ["Available variables: QUICK_LINK, EDP_VERSION, EDP_SEM_VERSION, EDP_GITTAG."],
    },
  ],
};
