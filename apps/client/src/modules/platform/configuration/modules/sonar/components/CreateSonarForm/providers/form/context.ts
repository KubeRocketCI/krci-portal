import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateSonarFormValues } from "../../schema";
import { createSonarFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateSonarForm(
  defaultValues: CreateSonarFormValues,
  onSubmit: (values: CreateSonarFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: createSonarFormSchema as unknown as FormValidateOrFn<CreateSonarFormValues>,
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

export type CreateSonarFormInstance = ReturnType<typeof useCreateSonarForm>;

export const CreateSonarFormContext = React.createContext<CreateSonarFormInstance | null>(null);
