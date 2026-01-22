import React from "react";
import { EditStageFormContext, type EditStageFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within EditStageFormProvider.
 */
export const useEditStageForm = (): EditStageFormInstance => {
  const context = React.useContext(EditStageFormContext);
  if (!context) {
    throw new Error("useEditStageForm must be used within EditStageFormProvider");
  }
  return context;
};
