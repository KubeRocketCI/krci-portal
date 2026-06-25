import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { createStageFormSchema, CreateStageFormValues } from "../../names";

// Never invoked at runtime — exists solely so ReturnType<> below can capture the fully-typed form instance.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateStageFormInternal(
  defaultValues: CreateStageFormValues,
  onSubmit: (values: CreateStageFormValues) => Promise<void> | void,
  onSubmitError: (error: unknown) => void,
  onSubmitInvalid?: (errors: unknown) => void
) {
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: createStageFormSchema as unknown as FormValidateOrFn<CreateStageFormValues>,
    },
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

export type CreateStageFormInstance = ReturnType<typeof useCreateStageFormInternal>;

export const CreateStageFormContext = React.createContext<CreateStageFormInstance | null>(null);
