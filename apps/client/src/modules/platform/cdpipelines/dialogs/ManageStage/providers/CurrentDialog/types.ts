import { ManageStageDialogProps } from "../../types";

export interface CurrentDialogContextProviderProps extends ManageStageDialogProps {
  children: React.ReactNode;
}

export type CurrentDialogContextProviderValue = ManageStageDialogProps;
