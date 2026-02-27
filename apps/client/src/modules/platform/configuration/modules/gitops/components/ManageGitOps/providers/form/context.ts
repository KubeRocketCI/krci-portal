import React from "react";
import { useAppForm } from "@/core/components/form";
import type { ManageGitOpsValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateGitOpsForm(
  defaultValues: ManageGitOpsValues,
  onSubmit: (values: ManageGitOpsValues) => Promise<void>
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}

// Export the form instance type
export type GitOpsFormInstance = ReturnType<typeof useCreateGitOpsForm>;

// Typed context
export const GitOpsFormContext = React.createContext<GitOpsFormInstance | null>(null);
