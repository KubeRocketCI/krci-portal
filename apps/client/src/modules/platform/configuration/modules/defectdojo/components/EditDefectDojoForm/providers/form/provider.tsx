import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditDefectDojoFormContext, EditDefectDojoFormInstance } from "./context";
import type { EditDefectDojoFormProviderProps } from "./types";
import type { EditDefectDojoFormValues } from "../../types";
import { editDefectDojoFormSchema } from "../../schema";

export const EditDefectDojoFormProvider: React.FC<EditDefectDojoFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditDefectDojoFormValues,
    validators: {
      onChange: editDefectDojoFormSchema as unknown as FormValidateOrFn<EditDefectDojoFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editDefectDojoFormSchema.safeParse(value);

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
    <EditDefectDojoFormContext.Provider value={form as EditDefectDojoFormInstance}>
      {children}
    </EditDefectDojoFormContext.Provider>
  );
};
