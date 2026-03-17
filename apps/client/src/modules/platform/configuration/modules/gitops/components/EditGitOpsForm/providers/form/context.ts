import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditGitOpsFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditGitOpsForm(
  defaultValues: EditGitOpsFormValues,
  onSubmit: (values: EditGitOpsFormValues) => Promise<void>
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}

export type EditGitOpsFormInstance = ReturnType<typeof useCreateEditGitOpsForm>;

export const EditGitOpsFormContext = React.createContext<EditGitOpsFormInstance | null>(null);
