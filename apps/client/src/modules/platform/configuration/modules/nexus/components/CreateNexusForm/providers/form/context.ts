import React from "react";
import { useAppForm } from "@/core/components/form";
import type { CreateNexusFormValues } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateNexusForm(
  defaultValues: CreateNexusFormValues,
  onSubmit: (values: CreateNexusFormValues) => Promise<void>,
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

export type CreateNexusFormInstance = ReturnType<typeof useCreateNexusForm>;

export const CreateNexusFormContext = React.createContext<CreateNexusFormInstance | null>(null);
