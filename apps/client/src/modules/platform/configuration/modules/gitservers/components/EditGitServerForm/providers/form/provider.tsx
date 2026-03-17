import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditGitServerFormContext, EditGitServerFormInstance } from "./context";
import type { EditGitServerFormProviderProps } from "./types";
import { editGitServerFormSchema, EditGitServerFormValues } from "../../names";

export const EditGitServerFormProvider: React.FC<EditGitServerFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditGitServerFormValues,
    validators: {
      onChange: editGitServerFormSchema as FormValidateOrFn<EditGitServerFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = editGitServerFormSchema.safeParse(value);
      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          formApi.setFieldMeta(error.path.join(".") as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }
      try {
        await onSubmit(validationResult.data);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <EditGitServerFormContext.Provider value={form as EditGitServerFormInstance}>
      {children}
    </EditGitServerFormContext.Provider>
  );
};
