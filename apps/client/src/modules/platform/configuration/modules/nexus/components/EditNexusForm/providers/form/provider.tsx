import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditNexusFormContext, EditNexusFormInstance } from "./context";
import type { EditNexusFormProviderProps } from "./types";
import type { EditNexusFormValues } from "../../types";
import { editNexusFormSchema } from "../../schema";

export const EditNexusFormProvider: React.FC<EditNexusFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditNexusFormValues,
    validators: {
      onChange: editNexusFormSchema as unknown as FormValidateOrFn<EditNexusFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editNexusFormSchema.safeParse(value);

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
    <EditNexusFormContext.Provider value={form as EditNexusFormInstance}>{children}</EditNexusFormContext.Provider>
  );
};
