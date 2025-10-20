import { useContext } from "react";
import { FilterContext } from "./context";
import { FilterContextValue, FilterValueMap } from "./types";

export function useFilterContext<Item = unknown, Values extends FilterValueMap = FilterValueMap>(): FilterContextValue<
  Item,
  Values
> {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }

  return context as FilterContextValue<Item, Values>;
}
