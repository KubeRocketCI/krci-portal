import React from "react";
import { PipelineRunContext } from "./context";
import type { UnifiedPipelineRunData } from "./types";

/**
 * Consume the unified pipeline run data from context.
 * Must be used within a PipelineRunProvider.
 */
export function usePipelineRunContext(): UnifiedPipelineRunData {
  const ctx = React.useContext(PipelineRunContext);
  if (!ctx) {
    throw new Error("usePipelineRunContext must be used within PipelineRunProvider");
  }
  return ctx;
}
