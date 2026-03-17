import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateArgoCDFormContext, CreateArgoCDFormInstance } from "./context";
import type { CreateArgoCDFormProviderProps } from "./types";
import type { CreateArgoCDFormValues } from "../../types";
import { createArgoCDFormSchema } from "../../schema";

export const CreateArgoCDFormProvider: React.FC<CreateArgoCDFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateArgoCDFormValues,
    validators: {
      onChange: createArgoCDFormSchema as unknown as FormValidateOrFn<CreateArgoCDFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createArgoCDFormSchema.safeParse(value);

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
    <CreateArgoCDFormContext.Provider value={form as CreateArgoCDFormInstance}>
      {children}
    </CreateArgoCDFormContext.Provider>
  );
};
