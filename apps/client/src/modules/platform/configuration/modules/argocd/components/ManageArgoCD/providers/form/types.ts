import type { ReactNode } from "react";
import { ManageArgoCDFormValues } from "../../names";

export interface ManageArgoCDFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageArgoCDFormValues>;
  onSubmit: (values: ManageArgoCDFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
