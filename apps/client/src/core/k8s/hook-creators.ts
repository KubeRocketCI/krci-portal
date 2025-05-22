import { KubeObjectBase } from "@my-project/shared";
import { usePermissions } from "./hooks/usePermissions";
import { useWatchList } from "./hooks/useWatchList";
import { k8sResourceConfig } from "./types";

export const createUsePermissionsHook = (k8sResourceConfig: k8sResourceConfig) => () =>
  usePermissions({
    group: k8sResourceConfig.group,
    version: k8sResourceConfig.apiVersion,
    resourcePlural: k8sResourceConfig.pluralName,
  });

export const createUseWatchListHook =
  <I extends KubeObjectBase>(k8sResourceConfig: k8sResourceConfig) =>
  () =>
    useWatchList<I>({
      group: k8sResourceConfig.group,
      version: k8sResourceConfig.apiVersion,
      resourcePlural: k8sResourceConfig.pluralName,
    });
