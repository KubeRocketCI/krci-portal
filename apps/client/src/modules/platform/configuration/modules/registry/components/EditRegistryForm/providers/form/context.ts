import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditRegistryFormValues } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditRegistryForm(
  defaultValues: EditRegistryFormValues,
  onSubmit: (values: EditRegistryFormValues) => Promise<void>,
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

export type EditRegistryFormInstance = ReturnType<typeof useEditRegistryForm>;

export const EditRegistryFormContext = React.createContext<EditRegistryFormInstance | null>(null);
