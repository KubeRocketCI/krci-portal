import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditDefectDojoFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditDefectDojoForm(
  defaultValues: EditDefectDojoFormValues,
  onSubmit: (values: EditDefectDojoFormValues) => Promise<void>,
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

export type EditDefectDojoFormInstance = ReturnType<typeof useEditDefectDojoForm>;

export const EditDefectDojoFormContext = React.createContext<EditDefectDojoFormInstance | null>(null);
