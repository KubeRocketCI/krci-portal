import type { ReactNode } from "react";
import { CreateStageFormValues } from "../../names";

export interface CreateStageFormProviderProps {
  children: ReactNode;
  onSubmit: (values: CreateStageFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
  onSubmitInvalid?: (errors: unknown) => void;
}
