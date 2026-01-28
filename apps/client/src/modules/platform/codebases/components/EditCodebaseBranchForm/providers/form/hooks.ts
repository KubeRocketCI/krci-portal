import React from "react";
import { EditCodebaseBranchFormContext, type EditCodebaseBranchFormInstance } from "./context";

export const useEditCodebaseBranchForm = (): EditCodebaseBranchFormInstance => {
  const context = React.useContext(EditCodebaseBranchFormContext);
  if (!context) {
    throw new Error("useEditCodebaseBranchForm must be used within EditCodebaseBranchFormProvider");
  }
  return context;
};
