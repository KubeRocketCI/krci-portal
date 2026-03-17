import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditDependencyTrackFormContext, EditDependencyTrackFormInstance } from "./context";
import type { EditDependencyTrackFormProviderProps } from "./types";
import type { EditDependencyTrackFormValues } from "../../types";
import { editDependencyTrackFormSchema } from "../../schema";

export const EditDependencyTrackFormProvider: React.FC<EditDependencyTrackFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditDependencyTrackFormValues,
    validators: {
      onChange: editDependencyTrackFormSchema as unknown as FormValidateOrFn<EditDependencyTrackFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editDependencyTrackFormSchema.safeParse(value);

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
    <EditDependencyTrackFormContext.Provider value={form as EditDependencyTrackFormInstance}>
      {children}
    </EditDependencyTrackFormContext.Provider>
  );
};
