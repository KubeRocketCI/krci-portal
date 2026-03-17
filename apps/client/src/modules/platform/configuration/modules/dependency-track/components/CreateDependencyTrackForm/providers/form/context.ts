import React from "react";
import { useAppForm } from "@/core/components/form";
import type { CreateDependencyTrackFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateDependencyTrackForm(
  defaultValues: CreateDependencyTrackFormValues,
  onSubmit: (values: CreateDependencyTrackFormValues) => Promise<void>,
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

export type CreateDependencyTrackFormInstance = ReturnType<typeof useCreateDependencyTrackForm>;

export const CreateDependencyTrackFormContext = React.createContext<CreateDependencyTrackFormInstance | null>(null);
