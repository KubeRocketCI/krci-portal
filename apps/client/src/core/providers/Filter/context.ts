import React from "react";
import { FilterContextProviderValue } from "./types";

export const FilterContext = React.createContext<FilterContextProviderValue<unknown, string>>({
  showFilter: false,
  filter: {
    values: {},
    matchFunctions: {},
  },
  setFilterItem: () => {
    //
  },
  setShowFilter: () => {
    //
  },
  resetFilter: () => {
    //
  },
  filterFunction: () => false,
});
