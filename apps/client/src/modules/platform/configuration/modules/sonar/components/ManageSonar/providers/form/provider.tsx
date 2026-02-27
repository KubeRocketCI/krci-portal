import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageSonarFormContext, ManageSonarFormInstance } from "./context";
import type { ManageSonarFormProviderProps } from "./types";
import { manageSonarFormSchema, ManageSonarFormValues } from "../../names";

export const ManageSonarFormProvider: React.FC<ManageSonarFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageSonarFormValues,
    validators: { onChange: manageSonarFormSchema as FormValidateOrFn<ManageSonarFormValues> },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageSonarFormSchema.safeParse(value);
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
    <ManageSonarFormContext.Provider value={form as ManageSonarFormInstance}>
      {children}
    </ManageSonarFormContext.Provider>
  );
};
