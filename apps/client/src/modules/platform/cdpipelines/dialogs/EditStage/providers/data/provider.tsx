import React from "react";
import { EditStageDataContext } from "./context";
import type { EditStageDataProviderProps } from "./types";

/**
 * Data provider for EditStage dialog.
 * Provides access to the Stage being edited and dialog controls.
 */
export const EditStageDataProvider: React.FC<EditStageDataProviderProps> = ({ stage, closeDialog, children }) => {
  const value = React.useMemo(() => ({ stage, closeDialog }), [stage, closeDialog]);

  return <EditStageDataContext.Provider value={value}>{children}</EditStageDataContext.Provider>;
};
