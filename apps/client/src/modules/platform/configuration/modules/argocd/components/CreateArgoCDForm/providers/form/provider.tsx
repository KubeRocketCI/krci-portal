import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateArgoCDFormContext } from "./context";
import type { CreateArgoCDFormProviderProps } from "./types";
import type { CreateArgoCDFormValues } from "../../types";
import { createArgoCDFormSchema } from "../../schema";

export const CreateArgoCDFormProvider: React.FC<CreateArgoCDFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateArgoCDFormValues,
    validators: {
      onChange: createArgoCDFormSchema as unknown as FormValidateOrFn<CreateArgoCDFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <CreateArgoCDFormContext.Provider value={form}>{children}</CreateArgoCDFormContext.Provider>;
};
