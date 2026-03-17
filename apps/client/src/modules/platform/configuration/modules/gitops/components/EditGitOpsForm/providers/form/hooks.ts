import React from "react";
import { EditGitOpsFormContext, type EditGitOpsFormInstance } from "./context";

export const useEditGitOpsForm = (): EditGitOpsFormInstance => {
  const context = React.useContext(EditGitOpsFormContext);
  if (!context) {
    throw new Error("useEditGitOpsForm must be used within EditGitOpsFormProvider");
  }
  return context;
};
