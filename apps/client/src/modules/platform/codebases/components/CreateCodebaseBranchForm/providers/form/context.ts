import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { CreateCodebaseBranchFormValues } from "../../types";
import { createCodebaseBranchSchema } from "../../schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateCodebaseBranchForm(
  defaultValues: CreateCodebaseBranchFormValues,
  validationContext: Parameters<typeof createCodebaseBranchSchema>[0],
  onSubmit: (values: CreateCodebaseBranchFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  const formSchema = createCodebaseBranchSchema(validationContext);

  return useAppForm({
    defaultValues,
    validators: {
      onChange: formSchema as unknown as FormValidateOrFn<CreateCodebaseBranchFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = formSchema.safeParse(value);

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

export type CreateCodebaseBranchFormInstance = ReturnType<typeof useCreateCodebaseBranchForm>;

export const CreateCodebaseBranchFormContext = React.createContext<CreateCodebaseBranchFormInstance | null>(null);

export const CreateValidationContext = React.createContext<{
  formSchema: ReturnType<typeof createCodebaseBranchSchema>;
} | null>(null);
