import React from "react";
import { Secret, QuickLink, Codemie } from "@my-project/shared";
import { DataContextProviderValue } from "./types";

export const DataContext = React.createContext<DataContextProviderValue>({
  quickLink: null as unknown as QuickLink,
  codemie: null as unknown as Codemie,
  codemieSecret: null as unknown as Secret,
  handleClosePanel: () => {
    //
  },
});
