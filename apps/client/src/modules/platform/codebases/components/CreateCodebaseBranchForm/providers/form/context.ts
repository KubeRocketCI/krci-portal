import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { CreateCodebaseBranchFormValues } from "../../types";
import { createCodebaseBranchSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateCodebaseBranchForm(
  defaultValues: CreateCodebaseBranchFormValues,
  onSubmit: (values: CreateCodebaseBranchFormValues) => Promise<void>,
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

export type CreateCodebaseBranchFormInstance = ReturnType<typeof useCreateCodebaseBranchForm>;

export const CreateCodebaseBranchFormContext = React.createContext<CreateCodebaseBranchFormInstance | null>(null);

export const CreateValidationContext = React.createContext<{
  formSchema: ReturnType<typeof createCodebaseBranchSchema>;
} | null>(null);
