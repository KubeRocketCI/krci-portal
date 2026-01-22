import React from "react";
import { EditCDPipelineFormContext, type EditCDPipelineFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within EditCDPipelineFormProvider.
 */
export const useEditCDPipelineForm = (): EditCDPipelineFormInstance => {
  const context = React.useContext(EditCDPipelineFormContext);
  if (!context) {
    throw new Error("useEditCDPipelineForm must be used within EditCDPipelineFormProvider");
  }
  return context;
};
