import type { ReactNode } from "react";
import type { CreateNexusFormValues } from "../../types";

export interface CreateNexusFormProviderProps {
  defaultValues: Partial<CreateNexusFormValues>;
  onSubmit: (values: CreateNexusFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
