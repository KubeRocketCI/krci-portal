import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditCodebaseBranchFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditCodebaseBranchForm(
  defaultValues: EditCodebaseBranchFormValues,
  onSubmit: (values: EditCodebaseBranchFormValues) => Promise<void>,
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

export type EditCodebaseBranchFormInstance = ReturnType<typeof useCreateEditCodebaseBranchForm>;

export const EditCodebaseBranchFormContext = React.createContext<EditCodebaseBranchFormInstance | null>(null);
