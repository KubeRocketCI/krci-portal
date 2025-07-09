import { ManageQuickLinkDialogProps } from "../../types";

export type CurrentDialogContextProviderProps = ManageQuickLinkDialogProps & {
  children: React.ReactNode;
};

export type CurrentDialogContextProviderValue = ManageQuickLinkDialogProps;
