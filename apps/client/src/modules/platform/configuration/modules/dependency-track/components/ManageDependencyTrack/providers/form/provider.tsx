import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageDependencyTrackFormContext, ManageDependencyTrackFormInstance } from "./context";
import type { ManageDependencyTrackFormProviderProps } from "./types";
import { manageDependencyTrackFormSchema, ManageDependencyTrackFormValues } from "../../names";

export const ManageDependencyTrackFormProvider: React.FC<ManageDependencyTrackFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageDependencyTrackFormValues,
    validators: {
      onChange: manageDependencyTrackFormSchema as FormValidateOrFn<ManageDependencyTrackFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageDependencyTrackFormSchema.safeParse(value);

      if (!validationResult.success) {
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
    <ManageDependencyTrackFormContext.Provider value={form as ManageDependencyTrackFormInstance}>
      {children}
    </ManageDependencyTrackFormContext.Provider>
  );
};
