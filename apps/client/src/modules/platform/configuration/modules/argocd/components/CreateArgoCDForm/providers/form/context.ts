import React from "react";
import { useAppForm } from "@/core/components/form";
import type { CreateArgoCDFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateArgoCDForm(
  defaultValues: CreateArgoCDFormValues,
  onSubmit: (values: CreateArgoCDFormValues) => Promise<void>,
  onSubmitError: (error: unknown) => void
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });
}

export type CreateArgoCDFormInstance = ReturnType<typeof useCreateArgoCDForm>;

export const CreateArgoCDFormContext = React.createContext<CreateArgoCDFormInstance | null>(null);
