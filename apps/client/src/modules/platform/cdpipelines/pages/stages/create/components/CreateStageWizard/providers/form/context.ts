import { useAppForm } from "@/core/components/form";
import React from "react";
import { createStageFormSchema, CreateStageFormValues } from "../../names";

// Internal hook to create the form with proper typing
// This captures the return type for TypeScript inference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateStageFormInternal(
  defaultValues: CreateStageFormValues,
  onSubmit: (values: CreateStageFormValues) => Promise<void> | void,
  onSubmitError: (error: unknown) => void,
  onSubmitInvalid?: (errors: unknown) => void
) {
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createStageFormSchema.safeParse(value);

      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          formApi.setFieldMeta(fieldPath as never, (prev) => ({
            ...prev,
            isTouched: true,
            errors: [error.message],
            errorMap: { onSubmit: error.message },
          }));
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
export type CreateStageFormInstance = ReturnType<typeof useCreateStageFormInternal>;

export const CreateStageFormContext = React.createContext<CreateStageFormInstance | null>(null);
