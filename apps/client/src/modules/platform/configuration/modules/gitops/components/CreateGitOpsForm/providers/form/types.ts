import type { ReactNode } from "react";
import type { CreateGitOpsFormValues } from "../../types";

export interface CreateGitOpsFormProviderProps {
  defaultValues: CreateGitOpsFormValues;
  onSubmit: (values: CreateGitOpsFormValues) => Promise<void>;
  children: ReactNode;
}
