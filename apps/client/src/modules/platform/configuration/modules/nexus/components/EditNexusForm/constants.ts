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
      description: "The external URL of your Nexus instance used as a quick access link in the platform navigation.",
      notes: ["Disabled if QuickLink resource is not found."],
    },
    {
      fieldName: "username",
      label: "Username",
      description: "The username for Nexus authentication.",
      notes: [
        "The username is stored securely as a Kubernetes secret.",
        "Disabled if the secret is managed by an external controller.",
      ],
    },
    {
      fieldName: "password",
      label: "Password",
      description: "The password for the Nexus user account.",
      notes: [
        "The password is stored securely as a Kubernetes secret.",
        "Disabled if the secret is managed by an external controller.",
      ],
    },
    {
      fieldName: "url",
      label: "URL",
      description: "The internal URL of your Nexus instance used by the platform to communicate with the Nexus API.",
      notes: ["Disabled if the secret is managed by an external controller."],
    },
  ],
};
