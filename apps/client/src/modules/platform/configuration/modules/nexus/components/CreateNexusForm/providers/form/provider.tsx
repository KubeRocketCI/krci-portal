import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateNexusFormContext } from "./context";
import type { CreateNexusFormProviderProps } from "./types";
import type { CreateNexusFormValues } from "../../types";
import { createNexusFormSchema } from "../../schema";

export const CreateNexusFormProvider: React.FC<CreateNexusFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateNexusFormValues,
    validators: {
      onChange: createNexusFormSchema as unknown as FormValidateOrFn<CreateNexusFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <CreateNexusFormContext.Provider value={form}>{children}</CreateNexusFormContext.Provider>;
};
