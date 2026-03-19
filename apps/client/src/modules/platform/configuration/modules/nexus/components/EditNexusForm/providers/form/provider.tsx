import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditNexusFormContext } from "./context";
import type { EditNexusFormProviderProps } from "./types";
import type { EditNexusFormValues } from "../../types";
import { editNexusFormSchema } from "../../schema";

export const EditNexusFormProvider: React.FC<EditNexusFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditNexusFormValues,
    validators: {
      onChange: editNexusFormSchema as unknown as FormValidateOrFn<EditNexusFormValues>,
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

  return <EditNexusFormContext.Provider value={form}>{children}</EditNexusFormContext.Provider>;
};
