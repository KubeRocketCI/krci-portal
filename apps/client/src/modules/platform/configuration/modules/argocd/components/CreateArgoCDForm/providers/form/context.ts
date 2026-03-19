import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateArgoCDFormValues } from "../../types";
import { createArgoCDFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateArgoCDForm(
  defaultValues: CreateArgoCDFormValues,
  onSubmit: (values: CreateArgoCDFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: createArgoCDFormSchema as unknown as FormValidateOrFn<CreateArgoCDFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

export type CreateArgoCDFormInstance = ReturnType<typeof useCreateArgoCDForm>;

export const CreateArgoCDFormContext = React.createContext<CreateArgoCDFormInstance | null>(null);
