import React from "react";
import { useTRPCClient } from "@/core/providers/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const EXPOSURE_REFETCH_INTERVAL_MS = 15_000;

export interface ExposureMetric {
  rps: number;
  successPct: number;
}

export interface ExposureMetrics {
  byKey: Map<string, ExposureMetric>;
  available: boolean;
}

export interface UseExposureMetricsParams {
  clusterName: string;
  namespace: string;
  gatewayNames?: string[];
  /** When false, the query is suspended (e.g. remote-cluster Stage or metrics unconfigured). */
  enabled: boolean;
}

export function useExposureMetrics(params: UseExposureMetricsParams): ExposureMetrics {
  const trpc = useTRPCClient();
  const { clusterName, namespace, gatewayNames, enabled } = params;

  const query = useQuery({
    queryKey: ["prometheus.getExposureMetrics", clusterName, namespace, ...(gatewayNames ?? [])],
    queryFn: () =>
      trpc.prometheus.getExposureMetrics.query({
        clusterName,
        namespace,
        gatewayNames,
      }),
    enabled,
    retry: 0,
    refetchInterval: EXPOSURE_REFETCH_INTERVAL_MS,
    staleTime: EXPOSURE_REFETCH_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });

  return React.useMemo<ExposureMetrics>(() => {
    if (query.isError || !query.isSuccess || !query.data) {
      return { byKey: new Map(), available: false };
    }
    const byKey = new Map(query.data.backends.map((b) => [b.key, { rps: b.rps, successPct: b.successPct }]));
    return { byKey, available: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt, query.isError, query.isSuccess]);
}
