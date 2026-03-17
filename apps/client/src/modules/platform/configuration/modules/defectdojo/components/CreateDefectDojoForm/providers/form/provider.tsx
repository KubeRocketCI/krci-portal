import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateDefectDojoFormContext, CreateDefectDojoFormInstance } from "./context";
import type { CreateDefectDojoFormProviderProps } from "./types";
import type { CreateDefectDojoFormValues } from "../../types";
import { createDefectDojoFormSchema } from "../../schema";

export const CreateDefectDojoFormProvider: React.FC<CreateDefectDojoFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateDefectDojoFormValues,
    validators: {
      onChange: createDefectDojoFormSchema as unknown as FormValidateOrFn<CreateDefectDojoFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createDefectDojoFormSchema.safeParse(value);

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
    <CreateDefectDojoFormContext.Provider value={form as CreateDefectDojoFormInstance}>
      {children}
    </CreateDefectDojoFormContext.Provider>
  );
};
