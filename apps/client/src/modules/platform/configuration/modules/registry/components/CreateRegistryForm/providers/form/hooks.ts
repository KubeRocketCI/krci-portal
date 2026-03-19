import React from "react";
import { CreateRegistryFormContext, type CreateRegistryFormInstance } from "./context";

export const useCreateRegistryForm = (): CreateRegistryFormInstance => {
  const context = React.useContext(CreateRegistryFormContext);
  if (!context) {
    throw new Error("useCreateRegistryForm must be used within CreateRegistryFormProvider");
  }
  return context;
};
