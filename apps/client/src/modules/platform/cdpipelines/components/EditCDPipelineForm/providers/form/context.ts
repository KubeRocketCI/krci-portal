import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditCDPipelineFormValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditCDPipelineForm(
  defaultValues: EditCDPipelineFormValues,
  onSubmit: (values: EditCDPipelineFormValues) => Promise<void>,
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
export type EditCDPipelineFormInstance = ReturnType<typeof useEditCDPipelineForm>;

// Typed context
export const EditCDPipelineFormContext = React.createContext<EditCDPipelineFormInstance | null>(null);
