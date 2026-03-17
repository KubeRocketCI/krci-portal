import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateSonarFormContext, CreateSonarFormInstance } from "./context";
import type { CreateSonarFormProviderProps } from "./types";
import type { CreateSonarFormValues } from "../../schema";
import { createSonarFormSchema } from "../../schema";

export const CreateSonarFormProvider: React.FC<CreateSonarFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateSonarFormValues,
    validators: {
      onChange: createSonarFormSchema as unknown as FormValidateOrFn<CreateSonarFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createSonarFormSchema.safeParse(value);

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
        onSubmitError?.(error);
      }
    },
  });

  return (
    <CreateSonarFormContext.Provider value={form as CreateSonarFormInstance}>
      {children}
    </CreateSonarFormContext.Provider>
  );
};
