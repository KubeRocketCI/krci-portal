import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { usePermissions } from "../../hooks/usePermissions";
import { useWatchItem, UseWatchItemParams } from "../../hooks/useWatchItem";
import { useWatchList, UseWatchListParams } from "../../hooks/useWatchList";

export type UseWatchListParamsWithoutResourceConfig<I extends KubeObjectBase> =
  | Omit<UseWatchListParams<I>, "resourceConfig">
  | undefined;
export type UseWatchItemParamsWithoutResourceConfig<I extends KubeObjectBase> = Omit<
  UseWatchItemParams<I>,
  "resourceConfig"
>;

export const createUsePermissionsHook = (k8sResourceConfig: K8sResourceConfig) => () =>
  usePermissions({
    group: k8sResourceConfig.group,
    version: k8sResourceConfig.version,
    resourcePlural: k8sResourceConfig.pluralName,
  });

export const createUseWatchListHook =
  <I extends KubeObjectBase>(k8sResourceConfig: K8sResourceConfig) =>
  (params?: UseWatchListParamsWithoutResourceConfig<I>) =>
    useWatchList<I>({ resourceConfig: k8sResourceConfig, ...params });

export const createUseWatchItemHook =
  <I extends KubeObjectBase>(k8sResourceConfig: K8sResourceConfig) =>
  (params: UseWatchItemParamsWithoutResourceConfig<I>) =>
    useWatchItem<I>({ resourceConfig: k8sResourceConfig, ...params });
