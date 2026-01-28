import React from "react";
import { EditCDPipelineDataContext } from "./context";
import type { EditCDPipelineDataProviderProps } from "./types";

/**
 * Data provider for EditCDPipeline dialog.
 * Provides access to the CDPipeline being edited.
 */
export const EditCDPipelineDataProvider: React.FC<EditCDPipelineDataProviderProps> = ({ cdPipeline, children }) => {
  const value = React.useMemo(() => ({ cdPipeline }), [cdPipeline]);

  return <EditCDPipelineDataContext.Provider value={value}>{children}</EditCDPipelineDataContext.Provider>;
};
