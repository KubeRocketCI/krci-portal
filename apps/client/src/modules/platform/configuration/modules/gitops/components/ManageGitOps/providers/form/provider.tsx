import React from "react";
import { useAppForm } from "@/core/form-temp";
import { GitOpsFormContext } from "./context";
import type { GitOpsFormProviderProps } from "./types";

/**
 * Form provider for ManageGitOps.
 * Creates and manages the TanStack Form instance.
 */
export const GitOpsFormProvider: React.FC<GitOpsFormProviderProps> = ({ defaultValues, onSubmit, children }) => {
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return <GitOpsFormContext.Provider value={form}>{children}</GitOpsFormContext.Provider>;
};
