import type { ReactNode } from "react";
import type { CreateArgoCDFormValues } from "../../types";

export interface CreateArgoCDFormProviderProps {
  defaultValues: Partial<CreateArgoCDFormValues>;
  onSubmit: (values: CreateArgoCDFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
