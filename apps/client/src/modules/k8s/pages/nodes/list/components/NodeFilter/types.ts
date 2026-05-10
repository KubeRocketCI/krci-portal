import { ValueOf } from "@/core/types/global";
import { nodeFilterControlNames } from "./constants";

export type NodeFilterNames = ValueOf<typeof nodeFilterControlNames>;

export type NodeListFilterValues = {
  [nodeFilterControlNames.SEARCH]: string;
};
