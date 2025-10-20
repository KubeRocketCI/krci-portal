import { useFilterContext } from "@/core/providers/Filter";
import type { StageFilterValues } from "../types";
import type { StageWithApplication } from "@/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";

export const useStageFilter = () => useFilterContext<StageWithApplication, StageFilterValues>();
