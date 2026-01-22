import React from "react";
import type { CDPipeline } from "@my-project/shared";

// Data context value type
export interface EditCDPipelineData {
  cdPipeline: CDPipeline;
}

export const EditCDPipelineDataContext = React.createContext<EditCDPipelineData | null>(null);
