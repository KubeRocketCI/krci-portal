import React from "react";
import { CurrentDialogContextProviderValue } from "./types";
import { Template } from "@my-project/shared";

const dialogInitialState = {
  open: false,
  openDialog: () => {
    //
  },
  closeDialog: () => {
    //
  },
};

export const CurrentDialogContext = React.createContext<CurrentDialogContextProviderValue>({
  props: {
    template: null as unknown as Template,
  },
  state: dialogInitialState,
});
