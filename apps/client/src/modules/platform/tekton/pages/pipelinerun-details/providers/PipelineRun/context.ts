import React from "react";
import type { UnifiedPipelineRunData } from "./types";

export const PipelineRunContext = React.createContext<UnifiedPipelineRunData | null>(null);
