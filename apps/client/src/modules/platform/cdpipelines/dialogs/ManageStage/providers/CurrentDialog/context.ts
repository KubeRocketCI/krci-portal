import React from "react";
import { CurrentDialogContextProviderValue } from "./types";
import { CDPipeline, Stage } from "@my-project/shared";

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
    stage: null as unknown as Stage,
    otherStages: null as unknown as Stage[],
    cdPipeline: null as unknown as CDPipeline,
  },
  state: dialogInitialState,
});
