import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditDefectDojoFormContext } from "./context";
import type { EditDefectDojoFormProviderProps } from "./types";
import type { EditDefectDojoFormValues } from "../../types";
import { editDefectDojoFormSchema } from "../../schema";

export const EditDefectDojoFormProvider: React.FC<EditDefectDojoFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditDefectDojoFormValues,
    validators: {
      onChange: editDefectDojoFormSchema as unknown as FormValidateOrFn<EditDefectDojoFormValues>,
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

  return <EditDefectDojoFormContext.Provider value={form}>{children}</EditDefectDojoFormContext.Provider>;
};
