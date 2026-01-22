import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { ManageCodebaseBranchFormValues } from "../../types";
import { createManageCodebaseBranchSchema, type ManageCodebaseBranchValidationContext } from "../../schema";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateCodebaseBranchForm(
  defaultValues: ManageCodebaseBranchFormValues,
  validationContext: ManageCodebaseBranchValidationContext,
  onSubmit: (values: ManageCodebaseBranchFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  const formSchema = React.useMemo(() => createManageCodebaseBranchSchema(validationContext), [validationContext]);

  const form = useAppForm({
    defaultValues,
    validators: {
      // TanStack Form has built-in support for Standard Schema (which Zod implements)
      // Type assertion needed: Zod schemas with .default() create input/output type mismatch
      // that doesn't align perfectly with TanStack Form's validator type expectations
      onChange: formSchema as unknown as FormValidateOrFn<ManageCodebaseBranchFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validate with Zod before submission
      const validationResult = formSchema.safeParse(value);

      if (!validationResult.success) {
        // Mark all fields with errors as touched so errors are displayed
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          // Type assertion needed: fieldPath is constructed dynamically from Zod error paths
          // TanStack Form's setFieldMeta expects a statically-known field name, but we're
          // building it at runtime. This is safe because Zod validates the same schema structure.
          formApi.setFieldMeta(fieldPath as never, (prev) => ({ ...prev, isTouched: true }));
        });

        // Errors are now displayed on the fields (marked as touched above)
        return;
      }

      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
  return form;
}

// Export the form instance type
export type CodebaseBranchFormInstance = ReturnType<typeof useCreateCodebaseBranchForm>;

// Typed context
export const CodebaseBranchFormContext = React.createContext<CodebaseBranchFormInstance | null>(null);

// Validation context to share schema with field components
export const ValidationContext = React.createContext<{
  formSchema: ReturnType<typeof createManageCodebaseBranchSchema>;
} | null>(null);
