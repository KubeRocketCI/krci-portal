import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateDependencyTrackFormContext, CreateDependencyTrackFormInstance } from "./context";
import type { CreateDependencyTrackFormProviderProps } from "./types";
import type { CreateDependencyTrackFormValues } from "../../types";
import { createDependencyTrackFormSchema } from "../../schema";

export const CreateDependencyTrackFormProvider: React.FC<CreateDependencyTrackFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateDependencyTrackFormValues,
    validators: {
      onChange: createDependencyTrackFormSchema as unknown as FormValidateOrFn<CreateDependencyTrackFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createDependencyTrackFormSchema.safeParse(value);

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
    <CreateDependencyTrackFormContext.Provider value={form as CreateDependencyTrackFormInstance}>
      {children}
    </CreateDependencyTrackFormContext.Provider>
  );
};
