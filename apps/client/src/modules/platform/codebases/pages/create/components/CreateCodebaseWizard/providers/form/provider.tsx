import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateCodebaseFormContext } from "./context";
import type { CreateCodebaseFormProviderProps } from "./types";
import { createCodebaseFormSchema, CreateCodebaseFormValues } from "../../names";
import { useDefaultValues } from "../../hooks/useDefaultValues";

export const CreateCodebaseFormProvider: React.FC<CreateCodebaseFormProviderProps> = ({
  children,
  onSubmit,
  onSubmitError,
  onSubmitInvalid,
}) => {
  const baseDefaultValues = useDefaultValues();

  const form = useAppForm({
    defaultValues: baseDefaultValues as CreateCodebaseFormValues,
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

  return <CreateCodebaseFormContext.Provider value={form}>{children}</CreateCodebaseFormContext.Provider>;
};
