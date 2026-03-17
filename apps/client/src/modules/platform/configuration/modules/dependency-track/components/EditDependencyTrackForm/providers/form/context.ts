import React from "react";
import { useAppForm } from "@/core/components/form";
import type { EditDependencyTrackFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditDependencyTrackForm(
  defaultValues: EditDependencyTrackFormValues,
  onSubmit: (values: EditDependencyTrackFormValues) => Promise<void>,
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

export type EditDependencyTrackFormInstance = ReturnType<typeof useEditDependencyTrackForm>;

export const EditDependencyTrackFormContext = React.createContext<EditDependencyTrackFormInstance | null>(null);
