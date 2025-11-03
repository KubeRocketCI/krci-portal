import React from "react";
import { GitServer, Secret } from "@my-project/shared";
import { DataContextProviderValue } from "./types";

export const DataContext = React.createContext<DataContextProviderValue>({
  gitServer: null as unknown as GitServer,
  gitServerSecret: null as unknown as Secret,
  handleClosePanel: () => {
    //
  },
});
