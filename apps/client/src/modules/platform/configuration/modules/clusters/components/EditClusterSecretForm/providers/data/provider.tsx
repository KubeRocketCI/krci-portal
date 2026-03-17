import React from "react";
import { ClusterSecretDataContext } from "./context";
import type { ClusterSecretDataProviderProps } from "./types";

/**
 * Data provider for ManageClusterSecret.
 * Provides access to mode, currentElement, ownerReference, etc.
 */
export const ClusterSecretDataProvider: React.FC<ClusterSecretDataProviderProps> = ({ formData, children }) => {
  return <ClusterSecretDataContext.Provider value={formData}>{children}</ClusterSecretDataContext.Provider>;
};
