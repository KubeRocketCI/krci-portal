import type { ReactNode } from "react";
import { CreateCDPipelineFormValues } from "../../types";

export interface CreateCDPipelineFormProviderProps {
  defaultValues: Partial<CreateCDPipelineFormValues>;
  onSubmit: (values: CreateCDPipelineFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  onSubmitInvalid?: (errors: unknown) => void;
  children: ReactNode;
}
