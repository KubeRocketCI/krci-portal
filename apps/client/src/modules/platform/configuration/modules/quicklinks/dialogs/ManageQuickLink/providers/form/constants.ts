import { NAMES } from "../../names";
import type { ManageQuickLinkFormValues } from "../../types";

// Default values for create mode
export const createDefaultValues: ManageQuickLinkFormValues = {
  [NAMES.ICON]: "",
  [NAMES.NAME]: "",
  [NAMES.URL]: "",
  [NAMES.VISIBLE]: true,
};
