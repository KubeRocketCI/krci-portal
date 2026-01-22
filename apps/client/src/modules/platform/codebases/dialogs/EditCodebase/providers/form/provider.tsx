import React from "react";
import { useAppForm } from "@/core/form-temp";
import { EditCodebaseFormContext } from "./context";
import type { EditCodebaseFormProviderProps } from "./types";

/**
 * Form provider for EditCodebase.
 * Creates and manages the TanStack Form instance.
 */
export const EditCodebaseFormProvider: React.FC<EditCodebaseFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <EditCodebaseFormContext.Provider value={form}>{children}</EditCodebaseFormContext.Provider>;
};
