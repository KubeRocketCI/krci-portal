import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditNexusFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditNexusForm(
  defaultValues: EditNexusFormValues,
  onSubmit: (values: EditNexusFormValues) => Promise<void>,
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

export type EditNexusFormInstance = ReturnType<typeof useCreateEditNexusForm>;

export const EditNexusFormContext = React.createContext<EditNexusFormInstance | null>(null);
