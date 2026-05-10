import { useFilterContext } from "@/core/providers/Filter";
import type { Node } from "@my-project/shared";
import type { NodeListFilterValues } from "../types";

export const useNodeFilter = () => useFilterContext<Node, NodeListFilterValues>();
