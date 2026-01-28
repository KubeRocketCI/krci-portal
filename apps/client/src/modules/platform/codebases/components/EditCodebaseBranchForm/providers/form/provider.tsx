import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditCodebaseBranchFormContext, EditCodebaseBranchFormInstance } from "./context";
import type { EditCodebaseBranchFormProviderProps } from "./types";
import type { EditCodebaseBranchFormValues } from "../../types";
import { editCodebaseBranchSchema } from "../../schema";

export const EditCodebaseBranchFormProvider: React.FC<EditCodebaseBranchFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditCodebaseBranchFormValues,
    validators: {
      onChange: editCodebaseBranchSchema as unknown as FormValidateOrFn<EditCodebaseBranchFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editCodebaseBranchSchema.safeParse(value);

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
    <EditCodebaseBranchFormContext.Provider value={form as EditCodebaseBranchFormInstance}>
      {children}
    </EditCodebaseBranchFormContext.Provider>
  );
};
