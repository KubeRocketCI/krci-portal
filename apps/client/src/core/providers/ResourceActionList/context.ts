import React from "react";
import { ResourceActionListContextProviderValue } from "./types";

export const ResourceActionListContext = React.createContext<ResourceActionListContextProviderValue<unknown>>({
  anchorEl: null,
  data: null as unknown,
  handleOpenResourceActionListMenu: () => {},
  handleCloseResourceActionListMenu: () => {},
});
