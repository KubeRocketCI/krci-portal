import React from "react";
import { CreateNexusFormContext, type CreateNexusFormInstance } from "./context";

export const useCreateNexusForm = (): CreateNexusFormInstance => {
  const context = React.useContext(CreateNexusFormContext);
  if (!context) {
    throw new Error("useCreateNexusForm must be used within CreateNexusFormProvider");
  }
  return context;
};
