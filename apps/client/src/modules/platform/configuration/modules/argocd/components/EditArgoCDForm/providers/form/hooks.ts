import React from "react";
import { EditArgoCDFormContext, type EditArgoCDFormInstance } from "./context";

export const useEditArgoCDForm = (): EditArgoCDFormInstance => {
  const context = React.useContext(EditArgoCDFormContext);
  if (!context) {
    throw new Error("useEditArgoCDForm must be used within EditArgoCDFormProvider");
  }
  return context;
};
