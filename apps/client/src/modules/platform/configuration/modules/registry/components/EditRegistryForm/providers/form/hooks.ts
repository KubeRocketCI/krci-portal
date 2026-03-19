import React from "react";
import { EditRegistryFormContext, type EditRegistryFormInstance } from "./context";

export const useEditRegistryForm = (): EditRegistryFormInstance => {
  const context = React.useContext(EditRegistryFormContext);
  if (!context) {
    throw new Error("useEditRegistryForm must be used within EditRegistryFormProvider");
  }
  return context;
};
