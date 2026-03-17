import React from "react";
import { ClusterSecretDataContext } from "./context";

/**
 * Hook to access the cluster secret data context.
 * Must be used within ClusterSecretDataProvider.
 */
export const useClusterSecretData = () => {
  const data = React.useContext(ClusterSecretDataContext);
  if (!data) {
    throw new Error("useClusterSecretData must be used within ClusterSecretDataProvider");
  }
  return data;
};
