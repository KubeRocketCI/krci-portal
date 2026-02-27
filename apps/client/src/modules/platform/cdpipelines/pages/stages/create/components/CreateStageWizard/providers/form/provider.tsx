import { useAppForm } from "@/core/components/form";
import React from "react";
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

  return <CreateStageFormContext.Provider value={form}>{children}</CreateStageFormContext.Provider>;
};
