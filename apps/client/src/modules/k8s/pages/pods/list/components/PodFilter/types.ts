import { ValueOf } from "@/core/types/global";
import { podFilterControlNames } from "./constants";

export type PodFilterNames = ValueOf<typeof podFilterControlNames>;

export type PodListFilterValues = {
  [podFilterControlNames.SEARCH]: string;
  [podFilterControlNames.STATUS]: string;
};
