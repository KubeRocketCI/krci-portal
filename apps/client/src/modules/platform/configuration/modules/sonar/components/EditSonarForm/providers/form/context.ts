import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditSonarFormValues } from "../../schema";
import { editSonarFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditSonarForm(
  defaultValues: EditSonarFormValues,
  onSubmit: (values: EditSonarFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editSonarFormSchema as unknown as FormValidateOrFn<EditSonarFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await onSubmit(value);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

export type EditSonarFormInstance = ReturnType<typeof useCreateEditSonarForm>;

export const EditSonarFormContext = React.createContext<EditSonarFormInstance | null>(null);
