import React from "react";
import { useAppForm } from "@/core/components/form";
import type { ManageRegistryFormValues } from "../../schema";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateManageRegistryForm(
  defaultValues: ManageRegistryFormValues,
  onSubmit: (values: ManageRegistryFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

// Export the form instance type
export type ManageRegistryFormInstance = ReturnType<typeof useCreateManageRegistryForm>;

// Typed context
export const ManageRegistryFormContext = React.createContext<ManageRegistryFormInstance | null>(null);
