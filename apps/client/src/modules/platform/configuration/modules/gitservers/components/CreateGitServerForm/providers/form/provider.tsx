import { useAppForm } from "@/core/components/form";
import React from "react";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateGitServerFormContext } from "./context";
import type { CreateGitServerFormProviderProps } from "./types";
import { createGitServerFormSchema, CreateGitServerFormValues } from "../../names";

export const CreateGitServerFormProvider: React.FC<CreateGitServerFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  onSubmitError,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as CreateGitServerFormValues,
    validators: {
      onChange: createGitServerFormSchema as FormValidateOrFn<CreateGitServerFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <CreateGitServerFormContext.Provider value={form}>{children}</CreateGitServerFormContext.Provider>;
};
