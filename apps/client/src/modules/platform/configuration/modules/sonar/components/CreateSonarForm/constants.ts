import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  TOKEN: "token",
  URL: "url",
} as const;

/**
 * FormGuide configuration for SonarQube integration creation
 */
export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "externalUrl",
      label: "Quick Link URL",
      description:
        "Enter the external URL of your SonarQube instance. This creates a quick access link in the platform navigation.",
    },
    {
      fieldName: "token",
      label: "Token",
      description:
        "Provide an authentication token for SonarQube. Generate this token from your SonarQube instance admin panel.",
      notes: ["The token is stored securely as a Kubernetes secret"],
    },
    {
      fieldName: "url",
      label: "URL",
      description:
        "Enter the internal URL of your SonarQube instance. Use HTTPS protocol (e.g., https://sonarqube.example.com).",
      notes: ["This URL is used by the platform to communicate with the SonarQube API"],
    },
  ],
};
