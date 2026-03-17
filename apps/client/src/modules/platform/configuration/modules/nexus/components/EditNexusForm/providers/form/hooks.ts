import React from "react";
import { EditNexusFormContext, type EditNexusFormInstance } from "./context";

export const useEditNexusForm = (): EditNexusFormInstance => {
  const context = React.useContext(EditNexusFormContext);
  if (!context) {
    throw new Error("useEditNexusForm must be used within EditNexusFormProvider");
  }
  return context;
};
