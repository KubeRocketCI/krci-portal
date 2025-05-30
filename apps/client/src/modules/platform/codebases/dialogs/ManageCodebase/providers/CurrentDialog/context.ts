import React from "react";
import { CurrentDialogContextProviderValue } from "./types";
import { Codebase } from "@my-project/shared";

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
    codebase: null as unknown as Codebase,
  },
  state: dialogInitialState,
});
