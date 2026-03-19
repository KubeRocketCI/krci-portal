import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditDependencyTrackFormValues } from "../../types";
import { editDependencyTrackFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditDependencyTrackForm(
  defaultValues: EditDependencyTrackFormValues,
  onSubmit: (values: EditDependencyTrackFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editDependencyTrackFormSchema as unknown as FormValidateOrFn<EditDependencyTrackFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await onSubmit(value);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

export type EditDependencyTrackFormInstance = ReturnType<typeof useEditDependencyTrackForm>;

export const EditDependencyTrackFormContext = React.createContext<EditDependencyTrackFormInstance | null>(null);
