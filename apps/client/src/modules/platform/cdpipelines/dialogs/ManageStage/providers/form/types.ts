import type { ReactNode } from "react";
import type { ManageStageFormValues } from "../../types";

// Form provider props
export interface StageFormProviderProps {
  defaultValues: Partial<ManageStageFormValues>;
  onSubmit: (values: ManageStageFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
