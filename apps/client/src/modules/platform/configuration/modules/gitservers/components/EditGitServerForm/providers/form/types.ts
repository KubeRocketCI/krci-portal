import type { ReactNode } from "react";
import type { EditGitServerFormValues } from "../../names";

export interface EditGitServerFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<EditGitServerFormValues>;
  onSubmit: (values: EditGitServerFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
}
