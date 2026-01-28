import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageRegistryFormContext, ManageRegistryFormInstance } from "./context";
import type { ManageRegistryFormProviderProps } from "./types";
import { manageRegistryFormSchema, ManageRegistryFormValues } from "../../schema";

export const ManageRegistryFormProvider: React.FC<ManageRegistryFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageRegistryFormValues,
    validators: {
      // Only validate on change - not on mount
      onChange: manageRegistryFormSchema as FormValidateOrFn<ManageRegistryFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validate with Zod before submission
      const validationResult = manageRegistryFormSchema.safeParse(value);

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
    <ManageRegistryFormContext.Provider value={form as ManageRegistryFormInstance}>
      {children}
    </ManageRegistryFormContext.Provider>
  );
};
