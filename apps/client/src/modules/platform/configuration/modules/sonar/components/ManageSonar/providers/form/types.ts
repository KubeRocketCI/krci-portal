import type { ReactNode } from "react";
import { ManageSonarFormValues } from "../../names";

export interface ManageSonarFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageSonarFormValues>;
  onSubmit: (values: ManageSonarFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
