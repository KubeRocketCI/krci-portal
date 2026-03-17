import React from "react";
import { CreateGitOpsFormContext, type CreateGitOpsFormInstance } from "./context";

export const useCreateGitOpsForm = (): CreateGitOpsFormInstance => {
  const context = React.useContext(CreateGitOpsFormContext);
  if (!context) {
    throw new Error("useCreateGitOpsForm must be used within CreateGitOpsFormProvider");
  }
  return context;
};
