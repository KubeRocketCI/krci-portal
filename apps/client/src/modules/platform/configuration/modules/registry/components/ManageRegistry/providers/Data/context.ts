import React from "react";
import { ConfigMap, Secret, ServiceAccount } from "@my-project/shared";
import { DataContextProviderValue } from "./types";

export const DataContext = React.createContext<DataContextProviderValue>({
  EDPConfigMap: null as unknown as ConfigMap,
  pushAccountSecret: null as unknown as Secret,
  pullAccountSecret: null as unknown as Secret,
  tektonServiceAccount: null as unknown as ServiceAccount,
  handleCloseCreateDialog: () => {
    //
  },
});
