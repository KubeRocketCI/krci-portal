import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { EditStageFormValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditStageForm(
  defaultValues: EditStageFormValues,
  onSubmit: (values: EditStageFormValues) => Promise<void>,
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
export type EditStageFormInstance = ReturnType<typeof useCreateEditStageForm>;

// Typed context
export const EditStageFormContext = React.createContext<EditStageFormInstance | null>(null);
