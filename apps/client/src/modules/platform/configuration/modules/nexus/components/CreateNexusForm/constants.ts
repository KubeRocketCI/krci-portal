import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  USERNAME: "username",
  PASSWORD: "password",
  URL: "url",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "externalUrl",
      label: "Quick Link URL",
      description:
        "Enter the external URL of your Nexus instance. This creates a quick access link in the platform navigation.",
    },
    {
      fieldName: "username",
      label: "Username",
      description:
        "Provide the username for Nexus authentication. This should be a service account with appropriate permissions.",
      notes: ["The username is stored securely as a Kubernetes secret"],
    },
    {
      fieldName: "password",
      label: "Password",
      description: "Provide the password for the Nexus user account.",
      notes: ["The password is stored securely as a Kubernetes secret"],
    },
    {
      fieldName: "url",
      label: "URL",
      description:
        "Enter the internal URL of your Nexus instance. Use HTTPS protocol (e.g., https://nexus.example.com).",
      notes: ["This URL is used by the platform to communicate with the Nexus API"],
    },
  ],
};
