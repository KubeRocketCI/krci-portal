import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditCDPipelineFormValues } from "../../types";
import { editCDPipelineSchema } from "../../schema";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditCDPipelineForm(
  defaultValues: EditCDPipelineFormValues,
  onSubmit: (values: EditCDPipelineFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editCDPipelineSchema as unknown as FormValidateOrFn<EditCDPipelineFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editCDPipelineSchema.safeParse(value);

      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          formApi.setFieldMeta(fieldPath as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }

      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

// Export the form instance type
export type EditCDPipelineFormInstance = ReturnType<typeof useEditCDPipelineForm>;

// Typed context
export const EditCDPipelineFormContext = React.createContext<EditCDPipelineFormInstance | null>(null);
