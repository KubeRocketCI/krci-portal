import type { Stage } from "@my-project/shared";
import type { ReactNode } from "react";
import type { EditStageFormValues } from "../../types";

// Form provider props
export interface EditStageFormProviderProps {
  stage: Stage;
  onSubmit: (values: EditStageFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
