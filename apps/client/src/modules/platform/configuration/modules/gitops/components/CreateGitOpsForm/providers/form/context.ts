import React from "react";
import { useAppForm } from "@/core/components/form";
import type { CreateGitOpsFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateGitOpsFormFn(
  defaultValues: CreateGitOpsFormValues,
  onSubmit: (values: CreateGitOpsFormValues) => Promise<void>
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}

export type CreateGitOpsFormInstance = ReturnType<typeof useCreateGitOpsFormFn>;

export const CreateGitOpsFormContext = React.createContext<CreateGitOpsFormInstance | null>(null);
