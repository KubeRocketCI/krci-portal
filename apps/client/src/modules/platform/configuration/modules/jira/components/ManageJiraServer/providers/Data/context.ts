import React from "react";
import { Secret, JiraServer } from "@my-project/shared";
import { DataContextProviderValue } from "./types";

export const DataContext = React.createContext<DataContextProviderValue>({
  secret: null as unknown as Secret,
  jiraServer: null as unknown as JiraServer,
  ownerReference: null as unknown as string,
  handleClosePanel: () => {
    //
  },
});
