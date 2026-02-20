import { Activity, Bot, Box, CloudUpload, Layers } from "lucide-react";

export const ENTITY_ICON = {
  project: Box,
  deployment: CloudUpload,
  stage: Layers,
  pipeline: Bot,
  pipelineRun: Activity,
} as const;
