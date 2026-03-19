import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditArgoCDFormContext } from "./context";
import type { EditArgoCDFormProviderProps } from "./types";
import type { EditArgoCDFormValues } from "../../types";
import { editArgoCDFormSchema } from "../../schema";

export const EditArgoCDFormProvider: React.FC<EditArgoCDFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditArgoCDFormValues,
    validators: {
      onChange: editArgoCDFormSchema as unknown as FormValidateOrFn<EditArgoCDFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await onSubmit(value);
        formApi.reset(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <EditArgoCDFormContext.Provider value={form}>{children}</EditArgoCDFormContext.Provider>;
};
