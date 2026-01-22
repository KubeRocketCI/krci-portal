import React from "react";
import { EditStageDataContext } from "./context";

/**
 * Hook to access the Stage data and dialog controls.
 * Must be used within EditStageDataProvider.
 */
export const useEditStageData = () => {
  const context = React.useContext(EditStageDataContext);
  if (!context) {
    throw new Error("useEditStageData must be used within EditStageDataProvider");
  }
  return context;
};
