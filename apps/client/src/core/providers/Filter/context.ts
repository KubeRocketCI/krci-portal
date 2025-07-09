import React from "react";
import { FilterContextValue, FilterValue } from "./types";

// Create a context with a default value that will be overridden by the provider
export const FilterContext = React.createContext<
  FilterContextValue<unknown, string, Record<string, FilterValue>> | undefined
>(undefined);
