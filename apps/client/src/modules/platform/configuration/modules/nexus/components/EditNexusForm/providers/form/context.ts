import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditNexusFormValues } from "../../types";
import { editNexusFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditNexusForm(
  defaultValues: EditNexusFormValues,
  onSubmit: (values: EditNexusFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editNexusFormSchema as unknown as FormValidateOrFn<EditNexusFormValues>,
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

export type EditNexusFormInstance = ReturnType<typeof useCreateEditNexusForm>;

export const EditNexusFormContext = React.createContext<EditNexusFormInstance | null>(null);
