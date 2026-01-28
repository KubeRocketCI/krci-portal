import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { ManageDefectDojoFormValues } from "../../names";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateManageDefectDojoForm(
  defaultValues: ManageDefectDojoFormValues,
  onSubmit: (values: ManageDefectDojoFormValues) => Promise<void>,
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
export type ManageDefectDojoFormInstance = ReturnType<typeof useCreateManageDefectDojoForm>;

// Typed context
export const ManageDefectDojoFormContext = React.createContext<ManageDefectDojoFormInstance | null>(null);
