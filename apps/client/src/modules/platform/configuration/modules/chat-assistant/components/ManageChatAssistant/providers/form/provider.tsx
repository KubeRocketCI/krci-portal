import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageChatAssistantFormContext } from "./context";
import type { ManageChatAssistantFormProviderProps } from "./types";
import { manageChatAssistantFormSchema, ManageChatAssistantFormValues } from "../../names";

export const ManageChatAssistantFormProvider: React.FC<ManageChatAssistantFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageChatAssistantFormValues,
    validators: {
      onChange: manageChatAssistantFormSchema as FormValidateOrFn<ManageChatAssistantFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageChatAssistantFormSchema.safeParse(value);
      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          formApi.setFieldMeta(error.path.join(".") as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <ManageChatAssistantFormContext.Provider value={form}>
      {children}
    </ManageChatAssistantFormContext.Provider>
  );
};
