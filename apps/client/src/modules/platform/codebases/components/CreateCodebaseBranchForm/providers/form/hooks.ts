import React from "react";
import { CreateCodebaseBranchFormContext, type CreateCodebaseBranchFormInstance } from "./context";
import { CreateValidationContext } from "./context";

export const useCreateCodebaseBranchForm = (): CreateCodebaseBranchFormInstance => {
  const context = React.useContext(CreateCodebaseBranchFormContext);
  if (!context) {
    throw new Error("useCreateCodebaseBranchForm must be used within CreateCodebaseBranchFormProvider");
  }
  return context;
};

export const useCreateValidationContext = () => {
  const context = React.useContext(CreateValidationContext);
  if (!context) {
    throw new Error("useCreateValidationContext must be used within CreateCodebaseBranchFormProvider");
  }
  return context;
};
