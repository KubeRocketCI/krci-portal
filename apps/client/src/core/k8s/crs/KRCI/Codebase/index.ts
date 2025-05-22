import { createUsePermissionsHook, createUseWatchListHook } from "@/core/k8s/hook-creators";
import { k8sResourceConfig } from "@/core/k8s/types";
import { getStatusIcon } from "./utils/getStatusIcon";
import type { Codebase } from "@my-project/shared";

export const k8sCodebaseConfig = {
  apiVersion: "v1",
  kind: "Codebase",
  group: "v2.edp.epam.com",
  singularName: "codebase",
  pluralName: "codebases",
} as const satisfies k8sResourceConfig;

export const k8sCodebaseStatus = {
  CREATED: "created",
  INITIALIZED: "initialized",
  IN_PROGRESS: "in progress",
  FAILED: "failed",
} as const;

export const K8sCodebase = {
  getStatusIcon,
  usePermissions: createUsePermissionsHook(k8sCodebaseConfig),
  useWatchList: createUseWatchListHook<Codebase>(k8sCodebaseConfig),
};
