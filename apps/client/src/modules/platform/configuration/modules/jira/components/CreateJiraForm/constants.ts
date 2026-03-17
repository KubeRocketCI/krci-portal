import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const NAMES = {
  URL: "url",
  USERNAME: "username",
  PASSWORD: "password",
} as const;

/**
 * FormGuide configuration for Jira integration creation
 */
export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "url",
      label: "URL",
      description: "Enter the URL of your Jira instance. Use HTTPS protocol (e.g., https://jira.example.com).",
      notes: ["This URL is used by the platform to communicate with the Jira API"],
    },
    {
      fieldName: "username",
      label: "Username",
      description:
        "Provide the username for Jira authentication. This should be a service account with appropriate permissions.",
      notes: ["The username is stored securely as a Kubernetes secret"],
    },
    {
      fieldName: "password",
      label: "Password",
      description: "Provide the password or API token for the Jira user account.",
      notes: ["The password is stored securely as a Kubernetes secret"],
    },
  ],
};
