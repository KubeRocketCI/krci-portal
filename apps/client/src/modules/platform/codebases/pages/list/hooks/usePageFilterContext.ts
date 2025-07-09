import { Codebase } from "@my-project/shared";
import { ComponentListFilterControlNames } from "../types";
import { useFilterContext } from "@/core/providers/Filter/hooks";

export const usePageFilterContext = () => {
  return useFilterContext<Codebase, ComponentListFilterControlNames>();
};
