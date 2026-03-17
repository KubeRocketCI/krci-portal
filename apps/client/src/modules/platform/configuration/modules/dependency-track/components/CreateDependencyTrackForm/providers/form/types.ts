import type { ReactNode } from "react";
import type { CreateDependencyTrackFormValues } from "../../types";

export interface CreateDependencyTrackFormProviderProps {
  defaultValues: Partial<CreateDependencyTrackFormValues>;
  onSubmit: (values: CreateDependencyTrackFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
