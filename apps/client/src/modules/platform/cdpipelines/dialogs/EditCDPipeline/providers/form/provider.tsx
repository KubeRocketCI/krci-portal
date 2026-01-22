import React from "react";
import { EditCDPipelineFormContext } from "./context";
import type { EditCDPipelineFormProviderProps } from "./types";
import { useDefaultValues } from "../../hooks/useDefaultValues";
import type { EditCDPipelineFormValues } from "../../types";
import { useAppForm } from "@/core/form-temp";

/**
 * Form provider for EditCDPipeline dialog.
 * Creates and manages the TanStack Form instance.
 */
export const EditCDPipelineFormProvider: React.FC<EditCDPipelineFormProviderProps> = ({
  cdPipeline,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const defaultValues = useDefaultValues(cdPipeline);

  const form = useAppForm({
    defaultValues: defaultValues as EditCDPipelineFormValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return <EditCDPipelineFormContext.Provider value={form}>{children}</EditCDPipelineFormContext.Provider>;
};
