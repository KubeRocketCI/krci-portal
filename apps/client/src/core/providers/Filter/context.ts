import { createContext } from "react";
import { FilterContextValue } from "./types";

// Use unknown for both generics to make it flexible, consumers will cast to proper types
export const FilterContext = createContext<FilterContextValue<unknown, Record<string, unknown>> | null>(null);
