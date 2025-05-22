import { createUsePermissionsHook, createUseWatchListHook } from "@/core/k8s/hook-creators";
import { k8sResourceConfig } from "@/core/k8s/types";
import { getStatusIcon } from "./utils/getStatusIcon";

export const k8sGitServerConfig = {
  apiVersion: "v1",
  kind: "GitServer",
  group: "v2.edp.epam.com",
  singularName: "gitserver",
  pluralName: "gitservers",
} as const satisfies k8sResourceConfig;

export const k8sGitServerStatus = {
  CREATED: "created",
  INITIALIZED: "initialized",
  IN_PROGRESS: "in progress",
  FAILED: "failed",
} as const;

export const K8sGitServer = {
  getStatusIcon,
  usePermissions: createUsePermissionsHook(k8sGitServerConfig),
  useWatchList: createUseWatchListHook(k8sGitServerConfig),
};
