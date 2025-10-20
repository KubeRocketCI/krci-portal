import { useFilterContext } from "@/core/providers/Filter";
import type { CDPipeline } from "@my-project/shared";
import type { CDPipelineFilterValues } from "../../components/CDPipelineFilter/types";

export const useCDPipelineFilter = () => useFilterContext<CDPipeline, CDPipelineFilterValues>();
