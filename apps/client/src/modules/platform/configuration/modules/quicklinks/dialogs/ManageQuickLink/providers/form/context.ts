import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { ManageQuickLinkFormValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateQuickLinkForm(
  defaultValues: ManageQuickLinkFormValues,
  onSubmit: (values: ManageQuickLinkFormValues) => Promise<void>
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}

// Export the form instance type
export type QuickLinkFormInstance = ReturnType<typeof useCreateQuickLinkForm>;

// Typed context
export const QuickLinkFormContext = React.createContext<QuickLinkFormInstance | null>(null);
