import React from "react";
import { useAppForm } from "@/core/components/form";
import type { ManageClusterSecretValues } from "../../types";

// Internal hook to create the form with proper typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCreateClusterSecretForm(
  defaultValues: ManageClusterSecretValues,
  onSubmit: (values: ManageClusterSecretValues) => Promise<void>
) {
  return useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}

// Export the form instance type
export type ClusterSecretFormInstance = ReturnType<typeof useCreateClusterSecretForm>;

// Typed context
export const ClusterSecretFormContext = React.createContext<ClusterSecretFormInstance | null>(null);
