import type { ReactNode } from "react";
import type { ManageJiraServerFormValues } from "../../names";

export interface ManageJiraServerFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageJiraServerFormValues>;
  onSubmit: (values: ManageJiraServerFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
