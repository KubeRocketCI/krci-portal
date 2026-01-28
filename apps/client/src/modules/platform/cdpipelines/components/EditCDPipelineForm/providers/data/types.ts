import type { CDPipeline } from "@my-project/shared";
import type { ReactNode } from "react";

// Data provider props
export interface EditCDPipelineDataProviderProps {
  cdPipeline: CDPipeline;
  children: ReactNode;
}
