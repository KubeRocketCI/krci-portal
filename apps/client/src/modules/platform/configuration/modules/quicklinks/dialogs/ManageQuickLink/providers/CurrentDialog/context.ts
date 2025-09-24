import React from "react";
import { CurrentDialogContextProviderValue } from "./types";
import { QuickLink } from "@my-project/shared";

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
    quickLink: null as unknown as QuickLink,
    isSystem: false,
    handleApply: () => {
      //
    },
  },
  state: dialogInitialState,
});
