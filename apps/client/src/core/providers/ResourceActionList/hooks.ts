import React from "react";
import { ResourceActionListContext } from "./context";
import { ResourceActionListContextProviderValue } from "./types";

export const useResourceActionListContext = <DataType = unknown>() =>
  React.useContext(ResourceActionListContext) as ResourceActionListContextProviderValue<DataType>;
