import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditRegistryFormContext } from "./context";
import type { EditRegistryFormProviderProps } from "./types";
import type { EditRegistryFormValues } from "../../schema";
import { editRegistryFormSchema } from "../../schema";

export const EditRegistryFormProvider: React.FC<EditRegistryFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditRegistryFormValues,
    validators: {
      onChange: editRegistryFormSchema as unknown as FormValidateOrFn<EditRegistryFormValues>,
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

  return <EditRegistryFormContext.Provider value={form}>{children}</EditRegistryFormContext.Provider>;
};
