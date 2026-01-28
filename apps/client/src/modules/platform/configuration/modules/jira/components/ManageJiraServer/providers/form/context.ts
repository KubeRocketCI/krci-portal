import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { ManageJiraServerFormValues } from "../../names";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateManageJiraServerForm(
  defaultValues: ManageJiraServerFormValues,
  onSubmit: (values: ManageJiraServerFormValues) => Promise<void>,
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

// Export the form instance type
export type ManageJiraServerFormInstance = ReturnType<typeof useCreateManageJiraServerForm>;

// Typed context
export const ManageJiraServerFormContext = React.createContext<ManageJiraServerFormInstance | null>(null);
