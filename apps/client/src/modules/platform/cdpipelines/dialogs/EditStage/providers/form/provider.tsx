import React from "react";
import { useAppForm } from "@/core/form-temp";
import { EditStageFormContext } from "./context";
import type { EditStageFormProviderProps } from "./types";
import { useDefaultValues } from "../../hooks/useDefaultValues";
import type { EditStageFormValues } from "../../types";

/**
 * Form provider for EditStage dialog.
 * Creates and manages the TanStack Form instance.
 */
export const EditStageFormProvider: React.FC<EditStageFormProviderProps> = ({
  stage,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const defaultValues = useDefaultValues(stage);

  const form = useAppForm({
    defaultValues: defaultValues as EditStageFormValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <EditStageFormContext.Provider value={form}>{children}</EditStageFormContext.Provider>;
};
