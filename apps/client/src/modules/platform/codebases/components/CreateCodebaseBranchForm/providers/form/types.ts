import type { ReactNode } from "react";
import type { CreateCodebaseBranchFormValues } from "../../types";
import type { CreateCodebaseBranchValidationContext } from "../../schema";

export interface CreateCodebaseBranchFormProviderProps {
  defaultValues: Partial<CreateCodebaseBranchFormValues>;
  validationContext: CreateCodebaseBranchValidationContext;
  onSubmit: (values: CreateCodebaseBranchFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
