import { useAppForm } from "@/core/form-temp";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { ManageGitServerFormContext } from "./context";
import type { ManageGitServerFormProviderProps } from "./types";
import { manageGitServerFormSchema, ManageGitServerFormValues } from "../../names";

export const ManageGitServerFormProvider: React.FC<ManageGitServerFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageGitServerFormValues,
    validators: {
      onChange: manageGitServerFormSchema as FormValidateOrFn<ManageGitServerFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = manageGitServerFormSchema.safeParse(value);
      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          formApi.setFieldMeta(error.path.join(".") as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }
      try {
        await onSubmit(validationResult.data);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <ManageGitServerFormContext.Provider value={form}>
      {children}
    </ManageGitServerFormContext.Provider>
  );
};
