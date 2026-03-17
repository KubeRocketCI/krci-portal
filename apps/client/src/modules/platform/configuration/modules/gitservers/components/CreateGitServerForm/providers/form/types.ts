import type { ReactNode } from "react";
import type { CreateGitServerFormValues } from "../../names";

export interface CreateGitServerFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<CreateGitServerFormValues>;
  onSubmit: (values: CreateGitServerFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
}
