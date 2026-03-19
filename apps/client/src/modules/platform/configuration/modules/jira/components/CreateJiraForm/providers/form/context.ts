import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateJiraFormValues } from "../../schema";
import { createJiraFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateJiraForm(
  defaultValues: CreateJiraFormValues,
  onSubmit: (values: CreateJiraFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: createJiraFormSchema as unknown as FormValidateOrFn<CreateJiraFormValues>,
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

export type CreateJiraFormInstance = ReturnType<typeof useCreateJiraForm>;

export const CreateJiraFormContext = React.createContext<CreateJiraFormInstance | null>(null);
