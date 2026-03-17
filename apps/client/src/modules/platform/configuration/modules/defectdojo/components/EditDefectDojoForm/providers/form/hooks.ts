import React from "react";
import { EditDefectDojoFormContext, type EditDefectDojoFormInstance } from "./context";

export const useEditDefectDojoForm = (): EditDefectDojoFormInstance => {
  const context = React.useContext(EditDefectDojoFormContext);
  if (!context) {
    throw new Error("useEditDefectDojoForm must be used within EditDefectDojoFormProvider");
  }
  return context;
};
