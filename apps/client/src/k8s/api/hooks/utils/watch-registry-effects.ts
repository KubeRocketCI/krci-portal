import { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { watchListRegistry } from "../../utils/watch-subscription-registry";
import { watchItemRegistry } from "../../utils/watch-item-subscription-registry";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

interface ListRegistryParams {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  labels?: Record<string, string>;
}

interface ItemRegistryParams {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  name: string;
}

/**
 * Registers and manages watch list subscription lifecycle
 */
export const useRegisterListSubscription = <I extends KubeObjectBase>(
  queryKey: unknown[],
  params: ListRegistryParams,
  queryClient: QueryClient,
  isFetched: boolean
) => {
  const { clusterName, namespace, resourceConfig } = params;

  useEffect(() => {
    watchListRegistry.register<I>(queryKey, params, queryClient);
    return () => watchListRegistry.unregister(queryKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterName, namespace, resourceConfig.pluralName, queryClient]);

  useEffect(() => {
    if (isFetched) {
      watchListRegistry.ensureStarted<I>(queryKey, queryClient);
    }
  }, [isFetched, queryKey, queryClient]);
};

/**
 * Registers and manages watch item subscription lifecycle
 */
export const useRegisterItemSubscription = <I extends KubeObjectBase>(
  queryKey: unknown[],
  params: ItemRegistryParams | null,
  queryClient: QueryClient,
  isFetched: boolean
) => {
  const enabled = params !== null;
  const clusterName = params?.clusterName;
  const namespace = params?.namespace;
  const resourceConfig = params?.resourceConfig;
  const name = params?.name;

  useEffect(() => {
    if (!enabled || !params) return;

    watchItemRegistry.register<I>(queryKey, params, queryClient);
    return () => watchItemRegistry.unregister(queryKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, clusterName, namespace, resourceConfig?.pluralName, name]);

  useEffect(() => {
    if (isFetched && enabled) {
      watchItemRegistry.ensureStarted<I>(queryKey, queryClient);
    }
  }, [isFetched, enabled, queryKey, queryClient]);
};
