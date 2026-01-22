import React from "react";
import type { Stage } from "@my-project/shared";

// Data context value type
export interface EditStageData {
  stage: Stage;
  closeDialog: () => void;
}

export const EditStageDataContext = React.createContext<EditStageData | null>(null);
