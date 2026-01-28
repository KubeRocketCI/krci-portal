/**
 * Form section names for the unified ArgoCD integration form
 */
export const FORM_NAMES = {
  QUICK_LINK: "quickLink",
  INTEGRATION_SECRET: "integrationSecret",
} as const;

/**
 * Field names for QuickLink section
 */
export const QUICK_LINK_FORM_NAMES = {
  EXTERNAL_URL: "externalUrl",
} as const;

/**
 * Field names for Integration Secret section
 */
export const INTEGRATION_SECRET_FORM_NAMES = {
  TOKEN: "token",
  URL: "url",
} as const;

/**
 * All field names for the unified ArgoCD form (used by schema)
 */
export const NAMES = {
  EXTERNAL_URL: QUICK_LINK_FORM_NAMES.EXTERNAL_URL,
  TOKEN: INTEGRATION_SECRET_FORM_NAMES.TOKEN,
  URL: INTEGRATION_SECRET_FORM_NAMES.URL,
} as const;
