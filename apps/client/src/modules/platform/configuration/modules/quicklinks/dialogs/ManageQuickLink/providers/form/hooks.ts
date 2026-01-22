import React from "react";
import { QuickLinkFormContext, type QuickLinkFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within QuickLinkFormProvider.
 */
export const useQuickLinkForm = (): QuickLinkFormInstance => {
  const form = React.useContext(QuickLinkFormContext);
  if (!form) {
    throw new Error("useQuickLinkForm must be used within QuickLinkFormProvider");
  }
  return form;
};
