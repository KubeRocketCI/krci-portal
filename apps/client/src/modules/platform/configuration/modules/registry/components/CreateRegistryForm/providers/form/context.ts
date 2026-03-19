import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateRegistryFormValues } from "../../schema";
import { createRegistryFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateRegistryForm(
  defaultValues: CreateRegistryFormValues,
  onSubmit: (values: CreateRegistryFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: createRegistryFormSchema as unknown as FormValidateOrFn<CreateRegistryFormValues>,
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

export type CreateRegistryFormInstance = ReturnType<typeof useCreateRegistryForm>;

export const CreateRegistryFormContext = React.createContext<CreateRegistryFormInstance | null>(null);
