import { useFilterContext } from "@/core/providers/Filter";
import type { KubeObjectBase } from "@my-project/shared";
import type { CRListFilterValues } from "../types";

export const useCRListFilter = () => useFilterContext<KubeObjectBase, CRListFilterValues>();
