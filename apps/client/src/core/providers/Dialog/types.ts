import React from "react";

export interface DialogState {
  open: boolean;
  closeDialog: () => void;
  openDialog: () => void;
}

export interface DialogProps<Props> {
  props: Props;
  state: DialogState;
}

interface DialogEntry {
  renderDialog: () => React.ReactElement;
  key: string;
}

export type DialogProviderState = {
  [key: string]: DialogEntry;
};
