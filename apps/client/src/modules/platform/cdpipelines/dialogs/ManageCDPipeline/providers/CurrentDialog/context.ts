import React from "react";
import { CurrentDialogContextProviderValue } from "./types";
import { CDPipeline } from "@my-project/shared";

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
    CDPipeline: null as unknown as CDPipeline,
  },
  state: dialogInitialState,
  extra: {
    applications: [],
  },
});
