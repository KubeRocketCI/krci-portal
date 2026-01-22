import React from "react";
import { GitOpsDataContext } from "./context";
import type { GitOpsDataProviderProps } from "./types";

/**
 * Data provider for ManageGitOps.
 * Provides access to currentElement, isReadOnly, handleClosePlaceholder.
 */
export const GitOpsDataProvider: React.FC<GitOpsDataProviderProps> = ({ formData, children }) => {
  return <GitOpsDataContext.Provider value={formData}>{children}</GitOpsDataContext.Provider>;
};
