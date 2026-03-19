import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateDefectDojoFormValues } from "../../types";
import { createDefectDojoFormSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateDefectDojoForm(
  defaultValues: CreateDefectDojoFormValues,
  onSubmit: (values: CreateDefectDojoFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: createDefectDojoFormSchema as unknown as FormValidateOrFn<CreateDefectDojoFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

export type CreateDefectDojoFormInstance = ReturnType<typeof useCreateDefectDojoForm>;

export const CreateDefectDojoFormContext = React.createContext<CreateDefectDojoFormInstance | null>(null);
