import type { ReactNode } from "react";
import type { CreateDefectDojoFormValues } from "../../types";

export interface CreateDefectDojoFormProviderProps {
  defaultValues: Partial<CreateDefectDojoFormValues>;
  onSubmit: (values: CreateDefectDojoFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
