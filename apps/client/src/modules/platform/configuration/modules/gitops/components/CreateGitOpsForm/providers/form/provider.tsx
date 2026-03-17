import React from "react";
import { useAppForm } from "@/core/components/form";
import { CreateGitOpsFormContext } from "./context";
import type { CreateGitOpsFormProviderProps } from "./types";

export const CreateGitOpsFormProvider: React.FC<CreateGitOpsFormProviderProps> = ({
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

  return <CreateGitOpsFormContext.Provider value={form}>{children}</CreateGitOpsFormContext.Provider>;
};
