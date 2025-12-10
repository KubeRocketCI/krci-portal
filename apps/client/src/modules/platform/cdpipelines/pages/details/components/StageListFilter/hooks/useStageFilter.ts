import { useFilterContext } from "@/core/providers/Filter";
import { Stage } from "@my-project/shared";
import type { StageFilterValues } from "../types";

export const useStageFilter = () => useFilterContext<Stage, StageFilterValues>();
