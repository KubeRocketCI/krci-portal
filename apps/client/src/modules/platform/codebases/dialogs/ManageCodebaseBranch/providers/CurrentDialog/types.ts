import { ManageCodebaseBranchDialogProps } from "../../types";

export interface CurrentDialogContextProviderProps extends ManageCodebaseBranchDialogProps {
  children: React.ReactNode;
}

export type CurrentDialogContextProviderValue = ManageCodebaseBranchDialogProps;
