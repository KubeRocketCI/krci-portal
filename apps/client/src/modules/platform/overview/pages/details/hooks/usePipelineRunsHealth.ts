import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { countPipelineRunPhases } from "../utils/countPipelineRunPhases";
import { useResourceHealth } from "./useResourceHealth";

export const usePipelineRunsHealth = () => useResourceHealth(usePipelineRunWatchList, countPipelineRunPhases);
