import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { ManageNexusFormValues } from "../../names";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateManageNexusForm(
  defaultValues: ManageNexusFormValues,
  onSubmit: (values: ManageNexusFormValues) => Promise<void>,
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
export type ManageNexusFormInstance = ReturnType<typeof useCreateManageNexusForm>;

// Typed context
export const ManageNexusFormContext = React.createContext<ManageNexusFormInstance | null>(null);
