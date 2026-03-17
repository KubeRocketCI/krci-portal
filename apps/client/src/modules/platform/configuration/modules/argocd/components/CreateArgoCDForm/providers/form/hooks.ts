import React from "react";
import { CreateArgoCDFormContext, type CreateArgoCDFormInstance } from "./context";

export const useCreateArgoCDForm = (): CreateArgoCDFormInstance => {
  const context = React.useContext(CreateArgoCDFormContext);
  if (!context) {
    throw new Error("useCreateArgoCDForm must be used within CreateArgoCDFormProvider");
  }
  return context;
};
