import { MatchFunctions, createSearchMatchFunction, createNamespaceMatchFunction } from "@/core/providers/Filter";
import type { KubeObjectBase } from "@my-project/shared";
import type { K8sListFilterValues } from "./types";

export const k8sListFilterControlNames = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const defaultK8sListFilterValues: K8sListFilterValues = {
  [k8sListFilterControlNames.SEARCH]: "",
  [k8sListFilterControlNames.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<KubeObjectBase, K8sListFilterValues> = {
  [k8sListFilterControlNames.SEARCH]: createSearchMatchFunction<KubeObjectBase>(),
  [k8sListFilterControlNames.NAMESPACES]: createNamespaceMatchFunction<KubeObjectBase>(),
};
