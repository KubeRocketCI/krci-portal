import React from "react";
import { EditCDPipelineDataContext } from "./context";

/**
 * Hook to access the CDPipeline data.
 * Must be used within EditCDPipelineDataProvider.
 */
export const useEditCDPipelineData = () => {
  const context = React.useContext(EditCDPipelineDataContext);
  if (!context) {
    throw new Error("useEditCDPipelineData must be used within EditCDPipelineDataProvider");
  }
  return context;
};
