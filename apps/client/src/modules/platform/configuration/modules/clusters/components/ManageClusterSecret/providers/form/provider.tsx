import React from "react";
import { useAppForm } from "@/core/form-temp";
import { ClusterSecretFormContext } from "./context";
import type { ClusterSecretFormProviderProps } from "./types";

/**
 * Form provider for ManageClusterSecret.
 * Creates and manages the TanStack Form instance.
 */
export const ClusterSecretFormProvider: React.FC<ClusterSecretFormProviderProps> = ({
  defaultValues,
  onSubmit,
  children,
}) => {
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return <ClusterSecretFormContext.Provider value={form}>{children}</ClusterSecretFormContext.Provider>;
};
