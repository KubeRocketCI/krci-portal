import type { ReactNode } from "react";
import type { EditCodebaseBranchFormValues } from "../../types";

export interface EditCodebaseBranchFormProviderProps {
  defaultValues: EditCodebaseBranchFormValues;
  onSubmit: (values: EditCodebaseBranchFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
