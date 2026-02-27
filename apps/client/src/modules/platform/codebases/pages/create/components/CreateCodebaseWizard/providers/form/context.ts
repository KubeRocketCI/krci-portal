import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { createCodebaseFormSchema, CreateCodebaseFormValues } from "../../schema";

// Internal hook to create the form with proper typing
// This captures the return type for TypeScript inference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateCodebaseFormInternal(
  defaultValues: CreateCodebaseFormValues,
  onSubmit: (values: CreateCodebaseFormValues) => Promise<void> | void,
  onSubmitError: (error: unknown) => void,
  onSubmitInvalid?: (errors: unknown) => void
) {
  const form = useAppForm({
    defaultValues,
    validators: {
      // Only validate on change - not on mount
      onChange: createCodebaseFormSchema as FormValidateOrFn<CreateCodebaseFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validate with Zod before submission
      const validationResult = createCodebaseFormSchema.safeParse(value);

      if (!validationResult.success) {
        // Mark all fields with errors as touched so errors are displayed
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          // Type assertion needed: fieldPath is constructed dynamically from Zod error paths
          // TanStack Form's setFieldMeta expects a statically-known field name, but we're
          // building it at runtime. This is safe because Zod validates the same schema structure.
          formApi.setFieldMeta(fieldPath as never, (prev) => ({ ...prev, isTouched: true }));
        });

        onSubmitInvalid?.(validationResult.error);
        return;
      }

      try {
        // Apply transformations before submission
        const transformedValue = {
          ...value,
          name: typeof value.name === "string" ? value.name.trim() : value.name,
        };
        await onSubmit(transformedValue);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return form;
}

// Export the form instance type - properly inferred from the hook
export type CreateCodebaseFormInstance = ReturnType<typeof useCreateCodebaseFormInternal>;

export const CreateCodebaseFormContext = React.createContext<CreateCodebaseFormInstance | null>(null);
