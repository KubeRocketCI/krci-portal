import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const DIALOG_NAME = "MANAGE_QUICK_LINK_DIALOG";

export const NAMES = {
  ICON: "icon",
  NAME: "name",
  URL: "url",
  VISIBLE: "visible",
} as const;

export const QUICK_LINK_FORM_NAMES = {
  [NAMES.ICON]: {
    name: NAMES.ICON,
    path: ["spec", "icon"],
  },
  [NAMES.NAME]: {
    name: NAMES.NAME,
    path: ["spec", "type"],
  },
  [NAMES.URL]: {
    name: NAMES.URL,
    path: ["spec", "url"],
  },
  [NAMES.VISIBLE]: {
    name: NAMES.VISIBLE,
    path: ["spec", "visible"],
  },
};

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "name",
      label: "Name",
      description: "A unique identifier for this link. Used internally and shown in the links list.",
    },
    {
      fieldName: "icon",
      label: "Icon",
      description: "Choose an icon to visually represent this link in the sidebar and overview pages.",
    },
    {
      fieldName: "url",
      label: "URL",
      description: "The full URL this link points to. Must be a valid HTTP or HTTPS address.",
    },
    {
      fieldName: "visible",
      label: "Visible",
      description:
        "Controls whether this link is shown in the sidebar navigation. Hidden links are still accessible by direct URL.",
    },
  ],
};
