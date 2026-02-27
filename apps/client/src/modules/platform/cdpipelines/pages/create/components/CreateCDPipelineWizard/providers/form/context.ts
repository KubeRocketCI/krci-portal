import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateCDPipelineFormValues } from "../../types";
import { createCDPipelineFormSchema } from "../../names";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateCDPipelineForm(
  defaultValues: Partial<CreateCDPipelineFormValues>,
  onSubmit: (values: CreateCDPipelineFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void,
  onSubmitInvalid?: (errors: unknown) => void
) {
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

  return form;
}

export type CreateCDPipelineFormInstance = ReturnType<typeof useCreateCDPipelineForm>;

export const CreateCDPipelineFormContext = React.createContext<CreateCDPipelineFormInstance | null>(null);
