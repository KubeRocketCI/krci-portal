import type { ReactNode } from "react";
import { ManageDependencyTrackFormValues } from "../../names";

export interface ManageDependencyTrackFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageDependencyTrackFormValues>;
  onSubmit: (values: ManageDependencyTrackFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
