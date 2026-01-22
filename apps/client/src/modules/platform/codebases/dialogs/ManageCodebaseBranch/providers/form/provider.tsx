import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CodebaseBranchFormContext, ValidationContext } from "./context";
import type { CodebaseBranchFormProviderProps } from "./types";
import type { ManageCodebaseBranchFormValues } from "../../types";
import { createManageCodebaseBranchSchema } from "../../schema";

/**
 * Form provider for ManageCodebaseBranch.
 * Creates and manages the TanStack Form instance.
 */
export const CodebaseBranchFormProvider: React.FC<CodebaseBranchFormProviderProps> = ({
  defaultValues,
  validationContext,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const formSchema = React.useMemo(() => createManageCodebaseBranchSchema(validationContext), [validationContext]);

  const form = useAppForm({
    defaultValues: defaultValues as ManageCodebaseBranchFormValues,
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

  return (
    <ValidationContext.Provider value={{ formSchema }}>
      <CodebaseBranchFormContext.Provider value={form}>{children}</CodebaseBranchFormContext.Provider>
    </ValidationContext.Provider>
  );
};
