import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageArgoCDFormContext, ManageArgoCDFormInstance } from "./context";
import type { ManageArgoCDFormProviderProps } from "./types";
import { manageArgoCDFormSchema, ManageArgoCDFormValues } from "../../names";

export const ManageArgoCDFormProvider: React.FC<ManageArgoCDFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageArgoCDFormValues,
    validators: {
      // Only validate on change - not on mount
      onChange: manageArgoCDFormSchema as FormValidateOrFn<ManageArgoCDFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validate with Zod before submission
      const validationResult = manageArgoCDFormSchema.safeParse(value);

      if (!validationResult.success) {
        // Mark all fields with errors as touched so errors are displayed
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          formApi.setFieldMeta(fieldPath as never, (prev) => ({ ...prev, isTouched: true }));
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
    <ManageArgoCDFormContext.Provider value={form as ManageArgoCDFormInstance}>
      {children}
    </ManageArgoCDFormContext.Provider>
  );
};
