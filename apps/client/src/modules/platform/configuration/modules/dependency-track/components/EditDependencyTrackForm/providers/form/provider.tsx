import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { EditDependencyTrackFormContext } from "./context";
import type { EditDependencyTrackFormProviderProps } from "./types";
import type { EditDependencyTrackFormValues } from "../../types";
import { editDependencyTrackFormSchema } from "../../schema";

export const EditDependencyTrackFormProvider: React.FC<EditDependencyTrackFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as EditDependencyTrackFormValues,
    validators: {
      onChange: editDependencyTrackFormSchema as unknown as FormValidateOrFn<EditDependencyTrackFormValues>,
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

  return <EditDependencyTrackFormContext.Provider value={form}>{children}</EditDependencyTrackFormContext.Provider>;
};
