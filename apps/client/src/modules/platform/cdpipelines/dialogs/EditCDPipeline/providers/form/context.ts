import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { EditCDPipelineFormValues } from "../../types";

// Internal hook to create the form with proper typing
// This captures the return type for TypeScript inference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditCDPipelineForm(
  defaultValues: EditCDPipelineFormValues,
  onSubmit: (values: EditCDPipelineFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

// Export the form instance type - properly inferred from the hook
export type EditCDPipelineFormInstance = ReturnType<typeof useCreateEditCDPipelineForm>;

// Typed context
export const EditCDPipelineFormContext = React.createContext<EditCDPipelineFormInstance | null>(null);
