import React from "react";
import { StageFormContext, type StageFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within StageFormProvider.
 */
export const useStageForm = (): StageFormInstance => {
  const form = React.useContext(StageFormContext);
  if (!form) {
    throw new Error("useStageForm must be used within StageFormProvider");
  }
  return form;
};
