import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageNexusFormContext, ManageNexusFormInstance } from "./context";
import type { ManageNexusFormProviderProps } from "./types";
import { manageNexusFormSchema, ManageNexusFormValues } from "../../names";

export const ManageNexusFormProvider: React.FC<ManageNexusFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageNexusFormValues,
    validators: { onChange: manageNexusFormSchema as FormValidateOrFn<ManageNexusFormValues> },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageNexusFormSchema.safeParse(value);
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
    <ManageNexusFormContext.Provider value={form as ManageNexusFormInstance}>
      {children}
    </ManageNexusFormContext.Provider>
  );
};
