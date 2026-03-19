import React from "react";
import { useAppForm } from "@/core/components/form";
import type { FormValidateOrFn } from "@tanstack/react-form";
import type { EditGitServerFormValues } from "../../names";
import { editGitServerFormSchema } from "../../names";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditGitServerFormFn(
  defaultValues: EditGitServerFormValues,
  onSubmit: (values: EditGitServerFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    validators: {
      onChange: editGitServerFormSchema as FormValidateOrFn<EditGitServerFormValues>,
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
}

export type EditGitServerFormInstance = ReturnType<typeof useEditGitServerFormFn>;

export const EditGitServerFormContext = React.createContext<EditGitServerFormInstance | null>(null);
