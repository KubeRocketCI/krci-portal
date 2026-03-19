import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditCodebaseBranchFormValues } from "../../types";
import { editCodebaseBranchSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditCodebaseBranchForm(
  defaultValues: EditCodebaseBranchFormValues,
  onSubmit: (values: EditCodebaseBranchFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
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
}

export type EditCodebaseBranchFormInstance = ReturnType<typeof useCreateEditCodebaseBranchForm>;

export const EditCodebaseBranchFormContext = React.createContext<EditCodebaseBranchFormInstance | null>(null);
