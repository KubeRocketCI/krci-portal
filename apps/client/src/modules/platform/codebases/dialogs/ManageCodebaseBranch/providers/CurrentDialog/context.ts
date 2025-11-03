import React from "react";
import { CurrentDialogContextProviderValue } from "./types";
import { Codebase, CodebaseBranch } from "@my-project/shared";

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
    codebaseBranches: null as unknown as CodebaseBranch[],
    codebase: null as unknown as Codebase,
    codebaseBranch: null as unknown as CodebaseBranch,
    defaultBranch: null as unknown as CodebaseBranch,
    pipelines: {
      review: "",
      build: "",
    },
  },
  state: dialogInitialState,
});
