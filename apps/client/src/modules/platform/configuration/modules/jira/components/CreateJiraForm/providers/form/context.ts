import React from "react";
import { useAppForm } from "@/core/components/form";
import type { CreateJiraFormValues } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateJiraForm(
  defaultValues: CreateJiraFormValues,
  onSubmit: (values: CreateJiraFormValues) => Promise<void>,
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

export type CreateJiraFormInstance = ReturnType<typeof useCreateJiraForm>;

export const CreateJiraFormContext = React.createContext<CreateJiraFormInstance | null>(null);
