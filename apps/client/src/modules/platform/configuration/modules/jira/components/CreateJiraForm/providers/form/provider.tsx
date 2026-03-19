import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateJiraFormContext } from "./context";
import type { CreateJiraFormProviderProps } from "./types";
import type { CreateJiraFormValues } from "../../schema";
import { createJiraFormSchema } from "../../schema";

export const CreateJiraFormProvider: React.FC<CreateJiraFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateJiraFormValues,
    validators: {
      onChange: createJiraFormSchema as unknown as FormValidateOrFn<CreateJiraFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <CreateJiraFormContext.Provider value={form}>{children}</CreateJiraFormContext.Provider>;
};
