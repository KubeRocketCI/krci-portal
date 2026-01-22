import type { ReactNode } from "react";
import type { ManageGitOpsValues } from "../../types";

// Form provider props
export interface GitOpsFormProviderProps {
  defaultValues: ManageGitOpsValues;
  onSubmit: (values: ManageGitOpsValues) => Promise<void>;
  children: ReactNode;
}
