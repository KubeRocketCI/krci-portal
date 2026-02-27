import React from "react";
import { useAppForm } from "@/core/components/form";
import { QuickLinkFormContext } from "./context";
import type { QuickLinkFormProviderProps } from "./types";

/**
 * Form provider for ManageQuickLink.
 * Creates and manages the TanStack Form instance.
 */
export const QuickLinkFormProvider: React.FC<QuickLinkFormProviderProps> = ({ defaultValues, onSubmit, children }) => {
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return <QuickLinkFormContext.Provider value={form}>{children}</QuickLinkFormContext.Provider>;
};
