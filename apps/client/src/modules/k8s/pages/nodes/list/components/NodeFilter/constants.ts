import { MatchFunctions, createSearchMatchFunction } from "@/core/providers/Filter";
import type { Node } from "@my-project/shared";
import type { NodeListFilterValues } from "./types";

export const nodeFilterControlNames = {
  SEARCH: "search",
} as const;

export const defaultNodeFilterValues: NodeListFilterValues = {
  [nodeFilterControlNames.SEARCH]: "",
};

export const matchFunctions: MatchFunctions<Node, NodeListFilterValues> = {
  [nodeFilterControlNames.SEARCH]: createSearchMatchFunction<Node>(),
};
