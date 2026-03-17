import React from "react";
import { useAppForm } from "@/core/components/form";
import type { CreateGitServerFormValues } from "../../names";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateGitServerFormFn(
  defaultValues: CreateGitServerFormValues,
  onSubmit: (values: CreateGitServerFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
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
