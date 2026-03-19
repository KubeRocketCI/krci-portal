import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditCodebaseFormValues } from "../../types";
import { editCodebaseSchema } from "../../schema";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateEditCodebaseForm(
  defaultValues: EditCodebaseFormValues,
  onSubmit: (values: EditCodebaseFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editCodebaseSchema as unknown as FormValidateOrFn<EditCodebaseFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editCodebaseSchema.safeParse(value);

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

// Export the form instance type
export type EditCodebaseFormInstance = ReturnType<typeof useCreateEditCodebaseForm>;

// Typed context
export const EditCodebaseFormContext = React.createContext<EditCodebaseFormInstance | null>(null);
