import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateGitServerFormValues } from "../../names";
import { createGitServerFormSchema } from "../../names";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateGitServerFormFn(
  defaultValues: CreateGitServerFormValues,
  onSubmit: (values: CreateGitServerFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: createGitServerFormSchema as FormValidateOrFn<CreateGitServerFormValues>,
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

export type CreateGitServerFormInstance = ReturnType<typeof useCreateGitServerFormFn>;

export const CreateGitServerFormContext = React.createContext<CreateGitServerFormInstance | null>(null);
