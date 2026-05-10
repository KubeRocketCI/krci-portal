import { useFilterContext } from "@/core/providers/Filter";
import type { KubeObjectBase } from "@my-project/shared";
import type { K8sListFilterValues } from "../types";

export const useK8sListFilter = () => useFilterContext<KubeObjectBase, K8sListFilterValues>();
