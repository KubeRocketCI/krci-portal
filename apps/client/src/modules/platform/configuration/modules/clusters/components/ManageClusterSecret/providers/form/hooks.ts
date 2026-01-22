import React from "react";
import { ClusterSecretFormContext, type ClusterSecretFormInstance } from "./context";

/**
 * Hook to access the form instance.
 * Must be used within ClusterSecretFormProvider.
 */
export const useClusterSecretForm = (): ClusterSecretFormInstance => {
  const form = React.useContext(ClusterSecretFormContext);
  if (!form) {
    throw new Error("useClusterSecretForm must be used within ClusterSecretFormProvider");
  }
  return form;
};
