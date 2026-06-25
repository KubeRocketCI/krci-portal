import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateStageFormContext } from "./context";
import type { CreateStageFormProviderProps } from "./types";
import { createStageFormSchema, CreateStageFormValues } from "../../names";

export const CreateStageFormProvider: React.FC<CreateStageFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
  onSubmitInvalid,
}) => {
  const form = useAppForm({
    defaultValues,
    validators: {
      // Only validate on change - not on mount. Drives the per-step gate in WizardNavigation
      // (form.validate("change")) so an invalid step (e.g. an unselected Clean Pipeline
      // template) blocks "Continue" instead of failing silently at submit.
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

  return <CreateStageFormContext.Provider value={form}>{children}</CreateStageFormContext.Provider>;
};
