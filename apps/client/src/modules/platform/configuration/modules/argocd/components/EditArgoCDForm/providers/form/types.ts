import type { ReactNode } from "react";
import type { EditArgoCDFormValues } from "../../types";

export interface EditArgoCDFormProviderProps {
  defaultValues: Partial<EditArgoCDFormValues>;
  onSubmit: (values: EditArgoCDFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
