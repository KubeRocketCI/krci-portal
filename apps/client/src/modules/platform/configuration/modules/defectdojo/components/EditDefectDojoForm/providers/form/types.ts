import type { ReactNode } from "react";
import type { EditDefectDojoFormValues } from "../../types";

export interface EditDefectDojoFormProviderProps {
  defaultValues: Partial<EditDefectDojoFormValues>;
  onSubmit: (values: EditDefectDojoFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
