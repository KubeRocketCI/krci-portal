import React from "react";
import { DataContextProviderValue } from "./types";

export const DataContext = React.createContext<DataContextProviderValue>({
  codebaseWatch: undefined as unknown as DataContextProviderValue["codebaseWatch"],
  codebaseBranchListWatch: undefined as unknown as DataContextProviderValue["codebaseBranchListWatch"],
  gitServerByCodebaseWatch: undefined as unknown as DataContextProviderValue["gitServerByCodebaseWatch"],
  quickLinkListWatch: undefined as unknown as DataContextProviderValue["quickLinkListWatch"],
  codebaseBranches: [],
  defaultBranch: undefined as unknown as DataContextProviderValue["defaultBranch"],
  reviewPipelineName: "",
  buildPipelineName: "",
});
