import type { ReactNode } from "react";
import { ManageDefectDojoFormValues } from "../../names";

export interface ManageDefectDojoFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageDefectDojoFormValues>;
  onSubmit: (values: ManageDefectDojoFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
