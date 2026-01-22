import type { ReactNode } from "react";
import type { ManageCodebaseBranchFormValues } from "../../types";
import type { ManageCodebaseBranchValidationContext } from "../../schema";

// Form provider props
export interface CodebaseBranchFormProviderProps {
  defaultValues: Partial<ManageCodebaseBranchFormValues>;
  validationContext: ManageCodebaseBranchValidationContext;
  onSubmit: (values: ManageCodebaseBranchFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
