import { useFilterContext } from "@/core/providers/Filter";
import { Codebase } from "@my-project/shared";
import { CodebaseListFilterValues } from "../types";

export const useCodebaseFilter = () => useFilterContext<Codebase, CodebaseListFilterValues>();
