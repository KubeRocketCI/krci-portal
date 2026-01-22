import React from "react";
import { CodebaseBranchFormContext, type CodebaseBranchFormInstance } from "./context";
import { ValidationContext } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within CodebaseBranchFormProvider.
 */
export const useCodebaseBranchForm = (): CodebaseBranchFormInstance => {
  const context = React.useContext(CodebaseBranchFormContext);
  if (!context) {
    throw new Error("useCodebaseBranchForm must be used within CodebaseBranchFormProvider");
  }
  return context;
};

/**
 * Hook to access the validation context (form schema).
 * Must be used within CodebaseBranchFormProvider.
 */
export const useValidationContext = () => {
  const context = React.useContext(ValidationContext);
  if (!context) {
    throw new Error("useValidationContext must be used within CodebaseBranchFormProvider");
  }
  return context;
};
