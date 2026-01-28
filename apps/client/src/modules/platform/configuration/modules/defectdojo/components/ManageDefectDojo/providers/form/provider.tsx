import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageDefectDojoFormContext, ManageDefectDojoFormInstance } from "./context";
import type { ManageDefectDojoFormProviderProps } from "./types";
import { manageDefectDojoFormSchema, ManageDefectDojoFormValues } from "../../names";

export const ManageDefectDojoFormProvider: React.FC<ManageDefectDojoFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageDefectDojoFormValues,
    validators: { onChange: manageDefectDojoFormSchema as FormValidateOrFn<ManageDefectDojoFormValues> },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageDefectDojoFormSchema.safeParse(value);
      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          formApi.setFieldMeta(error.path.join(".") as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }
      try {
        await onSubmit(value);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <ManageDefectDojoFormContext.Provider value={form as ManageDefectDojoFormInstance}>
      {children}
    </ManageDefectDojoFormContext.Provider>
  );
};
