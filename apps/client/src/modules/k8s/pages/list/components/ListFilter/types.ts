import { ValueOf } from "@/core/types/global";
import { k8sListFilterControlNames } from "./constants";

export type K8sListFilterNames = ValueOf<typeof k8sListFilterControlNames>;

export type K8sListFilterValues = {
  [k8sListFilterControlNames.SEARCH]: string;
  [k8sListFilterControlNames.NAMESPACES]: string[];
};
