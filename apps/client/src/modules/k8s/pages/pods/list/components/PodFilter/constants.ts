import { MatchFunctions, createSearchMatchFunction } from "@/core/providers/Filter";
import type { Pod } from "@my-project/shared";
import type { PodListFilterValues } from "./types";

export const podFilterControlNames = {
  SEARCH: "search",
  STATUS: "status",
} as const;

export const defaultPodFilterValues: PodListFilterValues = {
  [podFilterControlNames.SEARCH]: "",
  [podFilterControlNames.STATUS]: "all",
};

export const podPhaseValues = ["Running", "Pending", "Succeeded", "Failed", "Unknown"] as const;

export const matchFunctions: MatchFunctions<Pod, PodListFilterValues> = {
  [podFilterControlNames.SEARCH]: createSearchMatchFunction<Pod>(),
  [podFilterControlNames.STATUS]: (item, value) => {
    if (!value || value === "all") return true;
    return (item as { status?: { phase?: string } }).status?.phase === value;
  },
};
