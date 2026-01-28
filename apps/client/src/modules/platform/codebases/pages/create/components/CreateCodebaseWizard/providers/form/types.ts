import type { ReactNode } from "react";
import type { CreateCodebaseFormValues } from "../../schema";

export interface CreateCodebaseFormProviderProps {
  children: ReactNode;
  onSubmit: (values: CreateCodebaseFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
  onSubmitInvalid?: (errors: unknown) => void;
}
