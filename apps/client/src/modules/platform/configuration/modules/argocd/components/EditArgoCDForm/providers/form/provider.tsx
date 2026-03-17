import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditArgoCDFormContext, EditArgoCDFormInstance } from "./context";
import type { EditArgoCDFormProviderProps } from "./types";
import type { EditArgoCDFormValues } from "../../types";
import { editArgoCDFormSchema } from "../../schema";

export const EditArgoCDFormProvider: React.FC<EditArgoCDFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditArgoCDFormValues,
    validators: {
      onChange: editArgoCDFormSchema as unknown as FormValidateOrFn<EditArgoCDFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editArgoCDFormSchema.safeParse(value);

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
    <EditArgoCDFormContext.Provider value={form as EditArgoCDFormInstance}>{children}</EditArgoCDFormContext.Provider>
  );
};
