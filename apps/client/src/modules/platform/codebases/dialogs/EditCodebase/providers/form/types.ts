import type { ReactNode } from "react";
import type { EditCodebaseFormValues } from "../../types";

// Form provider props
export interface EditCodebaseFormProviderProps {
  defaultValues: EditCodebaseFormValues;
  onSubmit: (values: EditCodebaseFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
