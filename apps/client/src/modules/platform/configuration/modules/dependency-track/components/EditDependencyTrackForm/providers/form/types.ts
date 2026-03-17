import type { ReactNode } from "react";
import type { EditDependencyTrackFormValues } from "../../types";

export interface EditDependencyTrackFormProviderProps {
  defaultValues: Partial<EditDependencyTrackFormValues>;
  onSubmit: (values: EditDependencyTrackFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
