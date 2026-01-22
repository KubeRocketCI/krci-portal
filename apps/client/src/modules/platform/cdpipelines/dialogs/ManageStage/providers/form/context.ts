import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { ManageStageFormValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateStageForm(
  defaultValues: Partial<ManageStageFormValues>,
  onSubmit: (values: ManageStageFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues: defaultValues as ManageStageFormValues,
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
export type StageFormInstance = ReturnType<typeof useCreateStageForm>;

// Typed context
export const StageFormContext = React.createContext<StageFormInstance | null>(null);
