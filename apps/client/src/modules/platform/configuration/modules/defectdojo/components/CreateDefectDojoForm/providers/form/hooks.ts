import React from "react";
import { CreateDefectDojoFormContext, type CreateDefectDojoFormInstance } from "./context";

export const useCreateDefectDojoForm = (): CreateDefectDojoFormInstance => {
  const context = React.useContext(CreateDefectDojoFormContext);
  if (!context) {
    throw new Error("useCreateDefectDojoForm must be used within CreateDefectDojoFormProvider");
  }
  return context;
};
