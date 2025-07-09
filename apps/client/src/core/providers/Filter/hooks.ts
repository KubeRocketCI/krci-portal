import React from "react";
import { FilterContext } from "./context";
import { FilterContextValue } from "./types";

export const useFilterContext = <Item = unknown, ControlNames extends string = string>() => {
  const context = React.useContext(FilterContext);

  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }

  return context as FilterContextValue<Item, ControlNames>;
};
