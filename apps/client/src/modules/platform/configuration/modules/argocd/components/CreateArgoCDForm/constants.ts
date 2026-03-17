import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  TOKEN: "token",
  URL: "url",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "externalUrl",
      label: "Quick Link URL",
      description: "The external URL of your Argo CD instance that will be used as a quick link in the portal.",
      notes: ["Must use HTTPS protocol for security."],
    },
    {
      fieldName: "url",
      label: "Connection URL",
      description: "The URL used for API connections to your Argo CD instance.",
      notes: ["Must use HTTPS protocol.", "In create mode, this is automatically synced with the Quick Link URL."],
    },
    {
      fieldName: "token",
      label: "Authentication Token",
      description: "The API token used to authenticate with Argo CD.",
      notes: ["Generate this token from your Argo CD instance settings."],
    },
  ],
};
