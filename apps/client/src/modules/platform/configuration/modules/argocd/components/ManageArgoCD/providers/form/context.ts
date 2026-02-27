import React from "react";
import { useAppForm } from "@/core/components/form";
import type { ManageArgoCDFormValues } from "../../names";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateManageArgoCDForm(
  defaultValues: ManageArgoCDFormValues,
  onSubmit: (values: ManageArgoCDFormValues) => Promise<void>,
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
export type ManageArgoCDFormInstance = ReturnType<typeof useCreateManageArgoCDForm>;

// Typed context
export const ManageArgoCDFormContext = React.createContext<ManageArgoCDFormInstance | null>(null);
