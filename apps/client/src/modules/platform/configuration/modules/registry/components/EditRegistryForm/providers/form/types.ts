import type { ReactNode } from "react";
import type { EditRegistryFormValues } from "../../schema";

export interface EditRegistryFormProviderProps {
  defaultValues: Partial<EditRegistryFormValues>;
  onSubmit: (values: EditRegistryFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
