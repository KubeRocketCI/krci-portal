import React from "react";
import { EditCodebaseFormContext, type EditCodebaseFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within EditCodebaseFormProvider.
 */
export const useEditCodebaseForm = (): EditCodebaseFormInstance => {
  const form = React.useContext(EditCodebaseFormContext);
  if (!form) {
    throw new Error("useEditCodebaseForm must be used within EditCodebaseFormProvider");
  }
  return form;
};
