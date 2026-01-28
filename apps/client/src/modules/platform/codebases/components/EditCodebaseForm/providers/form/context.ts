import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { EditCodebaseFormValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditCodebaseForm(
  defaultValues: EditCodebaseFormValues,
  onSubmit: (values: EditCodebaseFormValues) => Promise<void>,
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
export type EditCodebaseFormInstance = ReturnType<typeof useCreateEditCodebaseForm>;

// Typed context
export const EditCodebaseFormContext = React.createContext<EditCodebaseFormInstance | null>(null);
