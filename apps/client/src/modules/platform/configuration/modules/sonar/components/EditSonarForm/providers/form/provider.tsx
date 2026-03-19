import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditSonarFormContext } from "./context";
import type { EditSonarFormProviderProps } from "./types";
import type { EditSonarFormValues } from "../../schema";
import { editSonarFormSchema } from "../../schema";

export const EditSonarFormProvider: React.FC<EditSonarFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditSonarFormValues,
    validators: {
      onChange: editSonarFormSchema as unknown as FormValidateOrFn<EditSonarFormValues>,
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

  return <EditSonarFormContext.Provider value={form}>{children}</EditSonarFormContext.Provider>;
};
