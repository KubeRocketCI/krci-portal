import React from "react";
import { useAppForm } from "@/core/components/form";
import { editClusterSecretFormSchema } from "../../../../schema";
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
    validators: {
      onChange: editClusterSecretFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return <ClusterSecretFormContext.Provider value={form}>{children}</ClusterSecretFormContext.Provider>;
};
