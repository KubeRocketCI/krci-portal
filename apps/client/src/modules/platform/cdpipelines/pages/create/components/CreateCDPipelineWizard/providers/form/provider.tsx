import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateCDPipelineFormContext } from "./context";
import type { CreateCDPipelineFormProviderProps } from "./types";
import { CreateCDPipelineFormValues } from "../../types";
import { createCDPipelineFormSchema } from "../../names";

export const CreateCDPipelineFormProvider: React.FC<CreateCDPipelineFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  onSubmitInvalid,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateCDPipelineFormValues,
    validators: {
      // Only validate on change - not on mount
      onChange: createCDPipelineFormSchema as FormValidateOrFn<CreateCDPipelineFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      // Validate with Zod before submission
      const validationResult = createCDPipelineFormSchema.safeParse(value);

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

  return <CreateCDPipelineFormContext.Provider value={form}>{children}</CreateCDPipelineFormContext.Provider>;
};
