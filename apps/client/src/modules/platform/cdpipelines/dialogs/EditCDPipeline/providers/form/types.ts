import type { CDPipeline } from "@my-project/shared";
import type { ReactNode } from "react";
import type { EditCDPipelineFormValues } from "../../types";

// Form provider props
export interface EditCDPipelineFormProviderProps {
  cdPipeline: CDPipeline;
  onSubmit: (values: EditCDPipelineFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
