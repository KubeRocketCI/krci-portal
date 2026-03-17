import React from "react";
import { useAppForm } from "@/core/components/form";
import { EditGitOpsFormContext } from "./context";
import type { EditGitOpsFormProviderProps } from "./types";

export const EditGitOpsFormProvider: React.FC<EditGitOpsFormProviderProps> = ({
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

  return <EditGitOpsFormContext.Provider value={form}>{children}</EditGitOpsFormContext.Provider>;
};
