import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateGitServerFormContext, CreateGitServerFormInstance } from "./context";
import type { CreateGitServerFormProviderProps } from "./types";
import { createGitServerFormSchema, CreateGitServerFormValues } from "../../names";

export const CreateGitServerFormProvider: React.FC<CreateGitServerFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateGitServerFormValues,
    validators: {
      onChange: createGitServerFormSchema as FormValidateOrFn<CreateGitServerFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = createGitServerFormSchema.safeParse(value);
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
    <CreateGitServerFormContext.Provider value={form as CreateGitServerFormInstance}>
      {children}
    </CreateGitServerFormContext.Provider>
  );
};
