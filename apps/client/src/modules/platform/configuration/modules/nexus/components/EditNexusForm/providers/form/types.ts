import type { ReactNode } from "react";
import type { EditNexusFormValues } from "../../types";

export interface EditNexusFormProviderProps {
  defaultValues: Partial<EditNexusFormValues>;
  onSubmit: (values: EditNexusFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
