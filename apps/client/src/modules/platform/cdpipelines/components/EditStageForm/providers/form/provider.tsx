import React from "react";
import { useAppForm } from "@/core/components/form";
import { EditStageFormContext, EditStageFormInstance } from "./context";
import type { EditStageFormProviderProps } from "./types";
import { useDefaultValues } from "../../hooks/useDefaultValues";
import type { EditStageFormValues } from "../../types";
import { editStageSchema } from "../../schema";

/**
 * Form provider for EditStage dialog.
 * Creates and manages the TanStack Form instance.
 */
export const EditStageFormProvider: React.FC<EditStageFormProviderProps> = ({
  stage,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const defaultValues = useDefaultValues(stage);

  const form = useAppForm({
    defaultValues: defaultValues as EditStageFormValues,
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editStageSchema.safeParse(value);

      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          formApi.setFieldMeta(fieldPath as never, (prev) => ({
            ...prev,
            isTouched: true,
            errors: [error.message],
            errorMap: { onSubmit: error.message },
          }));
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
    <EditStageFormContext.Provider value={form as EditStageFormInstance}>{children}</EditStageFormContext.Provider>
  );
};
