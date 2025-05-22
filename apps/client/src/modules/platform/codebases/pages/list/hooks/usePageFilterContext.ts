import { Codebase } from "@my-project/shared";
import { ComponentListFilterAllControlNames } from "../types";
import { useFilterContext } from "@/core/providers/Filter/hooks";

export const usePageFilterContext = () => {
  return useFilterContext<Codebase, ComponentListFilterAllControlNames>();
};
