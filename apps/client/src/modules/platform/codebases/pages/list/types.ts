import { Codebase } from "@my-project/shared";
import { codebaseListFilterControlNames } from "./constants";
import { FilterFunction } from "@/core/providers/Filter/types";

export type ComponentListFilterControlNames =
  | (typeof codebaseListFilterControlNames)[keyof typeof codebaseListFilterControlNames]
  | "search";

export type MatchFunctions = Record<ComponentListFilterControlNames, FilterFunction<Codebase>>;

// Define strict value types for each control
export type ComponentListFilterValueMap = {
  search: string;
  codebaseType: string;
};

// Example usage:
// This will make filter.values.search be typed as string, not FilterValue
// and filter.values.codebaseType be typed as string, not FilterValue
