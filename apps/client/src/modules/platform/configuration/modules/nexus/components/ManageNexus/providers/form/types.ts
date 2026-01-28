import type { ReactNode } from "react";
import { ManageNexusFormValues } from "../../names";

export interface ManageNexusFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageNexusFormValues>;
  onSubmit: (values: ManageNexusFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
