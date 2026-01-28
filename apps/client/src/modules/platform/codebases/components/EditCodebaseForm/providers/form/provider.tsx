import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditCodebaseFormContext, EditCodebaseFormInstance } from "./context";
import type { EditCodebaseFormProviderProps } from "./types";
import type { EditCodebaseFormValues } from "../../types";
import { editCodebaseSchema } from "../../schema";

/**
 * Form provider for EditCodebase.
 * Creates and manages the TanStack Form instance.
 */
export const EditCodebaseFormProvider: React.FC<EditCodebaseFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: editCodebaseSchema as unknown as FormValidateOrFn<EditCodebaseFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editCodebaseSchema.safeParse(value);

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
    <EditCodebaseFormContext.Provider value={form as EditCodebaseFormInstance}>
      {children}
    </EditCodebaseFormContext.Provider>
  );
};
