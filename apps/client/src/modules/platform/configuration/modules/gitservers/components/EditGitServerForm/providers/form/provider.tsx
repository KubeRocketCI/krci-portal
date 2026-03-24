import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditGitServerFormContext } from "./context";
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
      try {
        const parsedValue = editGitServerFormSchema.parse(value);
        await onSubmit(parsedValue, formApi);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <EditGitServerFormContext.Provider value={form}>{children}</EditGitServerFormContext.Provider>;
};
