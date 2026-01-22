import React from "react";
import { useAppForm } from "@/core/form-temp";
import { StageFormContext } from "./context";
import type { StageFormProviderProps } from "./types";
import type { ManageStageFormValues } from "../../types";

/**
 * Form provider for ManageStage.
 * Creates and manages the TanStack Form instance.
 */
export const StageFormProvider: React.FC<StageFormProviderProps> = ({
  defaultValues,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as ManageStageFormValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <StageFormContext.Provider value={form}>{children}</StageFormContext.Provider>;
};
