import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CodebaseBranchFormContext, ValidationContext } from "./context";
import type { CodebaseBranchFormProviderProps } from "./types";
import type { ManageCodebaseBranchFormValues } from "../../types";

/**
 * Form provider for ManageCodebaseBranch.
 * Creates and manages the TanStack Form instance.
 *
 * Generic over T so callers can provide mode-specific validation:
 * - Create mode: full schema with branch name, release, version validation
 * - Edit mode: focused schema validating only pipeline fields
 */
export function CodebaseBranchFormProvider<T extends Record<string, unknown>>({
  defaultValues,
  formSchema,
  onSubmit,
  onSubmitError,
  children,
}: CodebaseBranchFormProviderProps<T>) {
  const form = useAppForm({
    // Type assertion: TanStack Form's internal type is always ManageCodebaseBranchFormValues
    // (derived from the unused useCreateCodebaseBranchForm in context.ts), but the actual
    // runtime values and validation are governed by the formSchema prop.
    defaultValues: defaultValues as unknown as ManageCodebaseBranchFormValues,
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
        // Safe cast: Zod safeParse succeeded, so value conforms to T
        await onSubmit(value as unknown as T);
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
}
