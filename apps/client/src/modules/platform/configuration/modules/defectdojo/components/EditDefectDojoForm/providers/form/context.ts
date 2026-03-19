import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditDefectDojoFormValues } from "../../types";
import { editDefectDojoFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditDefectDojoForm(
  defaultValues: EditDefectDojoFormValues,
  onSubmit: (values: EditDefectDojoFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editDefectDojoFormSchema as unknown as FormValidateOrFn<EditDefectDojoFormValues>,
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

export type EditDefectDojoFormInstance = ReturnType<typeof useEditDefectDojoForm>;

export const EditDefectDojoFormContext = React.createContext<EditDefectDojoFormInstance | null>(null);
