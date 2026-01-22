import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateStageFormContext } from "./context";
import type { CreateStageFormProviderProps } from "./types";
import { createStageFormSchema, CreateStageFormValues } from "../../names";
import { useDefaultValues } from "../../hooks/useDefaultValues";

export const CreateStageFormProvider: React.FC<CreateStageFormProviderProps> = ({
  children,
  onSubmit,
  onSubmitError,
  onSubmitInvalid,
}) => {
  const baseDefaultValues = useDefaultValues();

  const form = useAppForm({
    defaultValues: baseDefaultValues as CreateStageFormValues,
    validators: {
      // Only validate on change - not on mount
      onChange: createStageFormSchema as FormValidateOrFn<CreateStageFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validate with Zod before submission
      const validationResult = createStageFormSchema.safeParse(value);

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

  return <CreateStageFormContext.Provider value={form}>{children}</CreateStageFormContext.Provider>;
};
