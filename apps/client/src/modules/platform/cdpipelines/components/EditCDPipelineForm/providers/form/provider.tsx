import React from "react";
import { EditCDPipelineFormContext, EditCDPipelineFormInstance } from "./context";
import type { EditCDPipelineFormProviderProps } from "./types";
import { useDefaultValues } from "../../hooks/useDefaultValues";
import type { EditCDPipelineFormValues } from "../../types";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { editCDPipelineSchema } from "../../schema";

/**
 * Form provider for EditCDPipeline dialog.
 * Creates and manages the TanStack Form instance.
 */
export const EditCDPipelineFormProvider: React.FC<EditCDPipelineFormProviderProps> = ({
  cdPipeline,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const defaultValues = useDefaultValues(cdPipeline);

  const form = useAppForm({
    defaultValues: defaultValues as EditCDPipelineFormValues,
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

  return (
    <EditCDPipelineFormContext.Provider value={form as EditCDPipelineFormInstance}>
      {children}
    </EditCDPipelineFormContext.Provider>
  );
};
