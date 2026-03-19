import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditRegistryFormValues } from "../../schema";
import { editRegistryFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditRegistryForm(
  defaultValues: EditRegistryFormValues,
  onSubmit: (values: EditRegistryFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editRegistryFormSchema as unknown as FormValidateOrFn<EditRegistryFormValues>,
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

export type EditRegistryFormInstance = ReturnType<typeof useEditRegistryForm>;

export const EditRegistryFormContext = React.createContext<EditRegistryFormInstance | null>(null);
