import { ValueOf } from "@/core/types/global";

export const DEPLOYMENT_TYPE = {
  CONTAINER: "container",
  CUSTOM: "custom",
} as const;

export type DeploymentType = ValueOf<typeof DEPLOYMENT_TYPE>;
