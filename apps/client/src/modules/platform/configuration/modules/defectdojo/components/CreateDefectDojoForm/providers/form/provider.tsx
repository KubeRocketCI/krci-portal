import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateDefectDojoFormContext } from "./context";
import type { CreateDefectDojoFormProviderProps } from "./types";
import type { CreateDefectDojoFormValues } from "../../types";
import { createDefectDojoFormSchema } from "../../schema";

export const CreateDefectDojoFormProvider: React.FC<CreateDefectDojoFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateDefectDojoFormValues,
    validators: {
      onChange: createDefectDojoFormSchema as unknown as FormValidateOrFn<CreateDefectDojoFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <CreateDefectDojoFormContext.Provider value={form}>{children}</CreateDefectDojoFormContext.Provider>;
};
