import type { Stage } from "@my-project/shared";
import type { ReactNode } from "react";

// Data provider props
export interface EditStageDataProviderProps {
  stage: Stage;
  closeDialog: () => void;
  children: ReactNode;
}
