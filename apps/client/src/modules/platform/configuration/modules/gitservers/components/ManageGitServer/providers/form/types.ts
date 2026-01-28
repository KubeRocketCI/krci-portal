import type { ReactNode } from "react";
import { ManageGitServerFormValues } from "../../names";

export interface ManageGitServerFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageGitServerFormValues>;
  onSubmit: (values: ManageGitServerFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
