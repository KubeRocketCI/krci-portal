import React from "react";
import { useShallow } from "zustand/react/shallow";
import { Activity, AlertCircle } from "lucide-react";
import { useClusterStore } from "@/k8s/store";
import { useResourceQuotaWatchList } from "@/k8s/api/groups/Core/ResourceQuota";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useTenantWatchItem } from "@/k8s/api/groups/Capsule/Tenant";
import { RESOURCE_QUOTA_LABEL_TENANT, inClusterName } from "@my-project/shared";
import { parseResourceQuota } from "./utils";
import { CircleProgress } from "./components/CircleProgress";
import { RQItem } from "./components/RQItem";
import { ParsedQuotas } from "./types";
import { Button } from "@/core/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";

export const ResourceQuotas = () => {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  // Global Resource Quotas
  const globalRQsWatch = useResourceQuotaWatchList({
    namespace: defaultNamespace,
    labels: {
      [RESOURCE_QUOTA_LABEL_TENANT]: defaultNamespace,
    },
  });

  const globalRQs = React.useMemo(() => {
    if (!globalRQsWatch.isReady || globalRQsWatch.data.array.length === 0) {
      return {
        quotas: {},
        highestUsedQuota: null,
      };
    }

    const useAnnotations = Object.keys(globalRQsWatch.data.array[0]?.metadata?.annotations || {}).some((key) =>
      key.includes("quota.capsule.clastix.io")
    );

    return parseResourceQuota(globalRQsWatch.data.array, useAnnotations);
  }, [globalRQsWatch.isReady, globalRQsWatch.data.array]);

  // Find first in-cluster Stage
  const stagesWatch = useStageWatchList({
    namespace: defaultNamespace,
  });

  const firstInClusterStage = React.useMemo(() => {
    if (!stagesWatch.isReady) return null;
    return stagesWatch.data.array.find((stage) => stage.spec.clusterName === inClusterName) ?? null;
  }, [stagesWatch.isReady, stagesWatch.data.array]);

  // Stage Resource Quotas
  const stageRQsWatch = useResourceQuotaWatchList({
    namespace: firstInClusterStage?.spec.namespace,
    queryOptions: {
      enabled: !!firstInClusterStage?.spec.namespace,
    },
  });

  const stageRQs = React.useMemo(() => {
    if (!stageRQsWatch.isReady || stageRQsWatch.data.array.length === 0) {
      return {
        quotas: {},
        highestUsedQuota: null,
      };
    }

    const useAnnotations = Object.keys(stageRQsWatch.data.array[0]?.metadata?.annotations || {}).some((key) =>
      key.includes("quota.capsule.clastix.io")
    );

    return parseResourceQuota(stageRQsWatch.data.array, useAnnotations);
  }, [stageRQsWatch.isReady, stageRQsWatch.data.array]);

  // Tenant/Namespace Quota
  const tenantWatch = useTenantWatchItem({
    name: `edp-workload-${defaultNamespace}`,
    namespace: defaultNamespace,
  });

  const namespacesQuota = React.useMemo(() => {
    if (!tenantWatch.isReady || !tenantWatch.data) {
      return {
        quotas: {} as ParsedQuotas,
        highestUsedQuota: null,
      };
    }

    const namespacesHard = tenantWatch.data.spec?.namespaceOptions?.quota;

    if (!namespacesHard) {
      return {
        quotas: {},
        highestUsedQuota: null,
      };
    }

    const namespacesUsed = tenantWatch.data.status?.size ?? 0;
    const usedPercentage = (namespacesUsed / namespacesHard) * 100;

    return {
      quotas: {
        namespaces: {
          hard: namespacesHard,
          hard_initial: String(namespacesHard),
          used: namespacesUsed,
          used_initial: String(namespacesUsed),
          usedPercentage: usedPercentage,
        },
      },
      highestUsedQuota: {
        usedPercentage: usedPercentage,
      },
    };
  }, [tenantWatch.isReady, tenantWatch.data]);

  // Calculate highest used quota
  const highestUsedQuota = React.useMemo(() => {
    const quotas = [globalRQs.highestUsedQuota, stageRQs.highestUsedQuota, namespacesQuota.highestUsedQuota].filter(
      Boolean
    );

    if (quotas.length === 0) {
      return null;
    }

    return quotas.reduce(
      (max, quota) => {
        return (quota?.usedPercentage ?? 0) > (max?.usedPercentage ?? 0) ? quota : max;
      },
      { usedPercentage: 0 }
    );
  }, [globalRQs, stageRQs, namespacesQuota]);

  if (globalRQsWatch.isLoading || stageRQsWatch.isLoading) {
    return null;
  }

  if (!globalRQs?.highestUsedQuota && !stageRQs?.highestUsedQuota && !namespacesQuota?.highestUsedQuota) {
    return null;
  }

  const getQuotaColor = (percentage: number) => {
    if (percentage < 70) return "#10b981"; // green
    if (percentage < 90) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  const highestPercentage = highestUsedQuota?.usedPercentage || 0;
  const quotaColor = getQuotaColor(highestPercentage);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full text-white hover:bg-white/10"
          title="Platform Resource Usage"
        >
          <CircleProgress loadPercentage={highestPercentage} color={quotaColor} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-w-[90vw] p-6" align="end">
        <div className="space-y-6">
          {/* Platform Resource Usage Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Activity className="text-primary h-4 w-4" />
              <h3 className="text-sm font-semibold">Platform Resource Usage</h3>
            </div>
            {globalRQsWatch.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size={24} />
              </div>
            ) : Object.keys(globalRQs.quotas).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="text-muted-foreground mb-2 h-12 w-12" />
                <p className="text-muted-foreground max-w-md text-sm">
                  Failed to retrieve resource information from the platform. Check your platform configuration.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {Object.entries(globalRQs.quotas).map(([entity, details]) => (
                  <RQItem key={`global-${entity}`} entity={entity} details={details} />
                ))}
              </div>
            )}
          </div>

          {/* Deployments Resource Usage Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Activity className="text-primary h-4 w-4" />
              <h3 className="text-sm font-semibold">Deployments Resource Usage</h3>
            </div>
            {stageRQsWatch.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size={24} />
              </div>
            ) : Object.keys(stageRQs.quotas).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="text-muted-foreground mb-2 h-12 w-12" />
                <p className="text-muted-foreground max-w-md text-sm">
                  Resource information is not available yet. It may take some time for the data to be generated.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {Object.entries(stageRQs.quotas).map(([entity, details]) => (
                  <RQItem key={`stage-${entity}`} entity={entity} details={details} />
                ))}
                {Object.entries(namespacesQuota.quotas).map(([entity, details]) => (
                  <RQItem key={`namespaces-${entity}`} entity={entity} details={details} />
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
