import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateNexusFormContext, CreateNexusFormInstance } from "./context";
import type { CreateNexusFormProviderProps } from "./types";
import type { CreateNexusFormValues } from "../../types";
import { createNexusFormSchema } from "../../schema";

export const CreateNexusFormProvider: React.FC<CreateNexusFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateNexusFormValues,
    validators: {
      onChange: createNexusFormSchema as unknown as FormValidateOrFn<CreateNexusFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createNexusFormSchema.safeParse(value);

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
    <CreateNexusFormContext.Provider value={form as CreateNexusFormInstance}>
      {children}
    </CreateNexusFormContext.Provider>
  );
};
