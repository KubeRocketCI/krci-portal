import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditArgoCDFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditArgoCDForm(
  defaultValues: EditArgoCDFormValues,
  onSubmit: (values: EditArgoCDFormValues) => Promise<void>,
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

export type EditArgoCDFormInstance = ReturnType<typeof useEditArgoCDForm>;

export const EditArgoCDFormContext = React.createContext<EditArgoCDFormInstance | null>(null);
