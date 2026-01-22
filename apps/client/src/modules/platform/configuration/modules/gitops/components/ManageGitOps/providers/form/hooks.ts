import React from "react";
import { GitOpsFormContext, type GitOpsFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within GitOpsFormProvider.
 */
export const useGitOpsForm = (): GitOpsFormInstance => {
  const form = React.useContext(GitOpsFormContext);
  if (!form) {
    throw new Error("useGitOpsForm must be used within GitOpsFormProvider");
  }
  return form;
};
