import React from "react";

interface DialogEntry<Props = object> {
  Component: React.ComponentType<DialogProps<Props>>;
  props: Props;
}

export type DialogProviderState = {
  [key: string]: DialogEntry;
};

export interface DialogProps<Props> {
  props: Props;
  state: {
    open: boolean;
    closeDialog: () => void;
    openDialog: () => void;
  };
}
