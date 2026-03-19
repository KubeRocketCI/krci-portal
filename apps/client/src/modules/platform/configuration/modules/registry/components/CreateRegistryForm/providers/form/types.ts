import type { ReactNode } from "react";
import type { CreateRegistryFormValues } from "../../schema";

export interface CreateRegistryFormProviderProps {
  defaultValues: Partial<CreateRegistryFormValues>;
  onSubmit: (values: CreateRegistryFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
