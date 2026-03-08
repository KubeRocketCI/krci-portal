import React from "react";
import { PipelineRunContext } from "./context";
import { useUnifiedPipelineRun } from "../../hooks/data";

export const PipelineRunProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useUnifiedPipelineRun();
  return <PipelineRunContext.Provider value={data}>{children}</PipelineRunContext.Provider>;
};
