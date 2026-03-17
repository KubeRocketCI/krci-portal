import type { ReactNode } from "react";
import type { EditGitOpsFormValues } from "../../types";

export interface EditGitOpsFormProviderProps {
  defaultValues: EditGitOpsFormValues;
  onSubmit: (values: EditGitOpsFormValues) => Promise<void>;
  children: ReactNode;
}
