import React from "react";
import { GitOpsDataContext } from "./context";

/**
 * Hook to access the GitOps data context.
 * Must be used within GitOpsDataProvider.
 */
export const useGitOpsData = () => {
  const data = React.useContext(GitOpsDataContext);
  if (!data) {
    throw new Error("useGitOpsData must be used within GitOpsDataProvider");
  }
  return data;
};
