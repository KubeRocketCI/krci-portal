import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditArgoCDFormValues } from "../../types";
import { editArgoCDFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditArgoCDForm(
  defaultValues: EditArgoCDFormValues,
  onSubmit: (values: EditArgoCDFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editArgoCDFormSchema as unknown as FormValidateOrFn<EditArgoCDFormValues>,
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

export type EditArgoCDFormInstance = ReturnType<typeof useEditArgoCDForm>;

export const EditArgoCDFormContext = React.createContext<EditArgoCDFormInstance | null>(null);
