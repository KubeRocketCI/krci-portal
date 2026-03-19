import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateRegistryFormContext, CreateRegistryFormInstance } from "./context";
import type { CreateRegistryFormProviderProps } from "./types";
import type { CreateRegistryFormValues } from "../../schema";
import { createRegistryFormSchema } from "../../schema";

export const CreateRegistryFormProvider: React.FC<CreateRegistryFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateRegistryFormValues,
    validators: {
      onChange: createRegistryFormSchema as unknown as FormValidateOrFn<CreateRegistryFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <CreateRegistryFormContext.Provider value={form as CreateRegistryFormInstance}>
      {children}
    </CreateRegistryFormContext.Provider>
  );
};
