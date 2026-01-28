import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageJiraServerFormContext, ManageJiraServerFormInstance } from "./context";
import type { ManageJiraServerFormProviderProps } from "./types";
import { manageJiraServerFormSchema, ManageJiraServerFormValues } from "../../names";

export const ManageJiraServerFormProvider: React.FC<ManageJiraServerFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageJiraServerFormValues,
    validators: {
      onChange: manageJiraServerFormSchema as FormValidateOrFn<ManageJiraServerFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageJiraServerFormSchema.safeParse(value);

      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          formApi.setFieldMeta(fieldPath as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }

      try {
        await onSubmit(value);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <ManageJiraServerFormContext.Provider value={form as ManageJiraServerFormInstance}>
      {children}
    </ManageJiraServerFormContext.Provider>
  );
};
