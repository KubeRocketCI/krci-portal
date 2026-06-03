import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { PATH_K8S_LIST_FULL } from "@/modules/k8s/constants/paths";
import type { KubeObjectBase } from "@my-project/shared";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import type { WorkloadResults } from "../hooks/useClusterOverview";
import { bucketWorkload, WORKLOAD_KINDS, type WorkloadKind } from "../utils/workload";
import { DonutCardBody } from "./DonutChart";

interface WorkloadStatusSectionProps {
  clusterName: string;
  workloads: WorkloadResults;
}

export function WorkloadStatusSection({ clusterName, workloads }: WorkloadStatusSectionProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {WORKLOAD_KINDS.map(({ key, label }) => (
        <WorkloadKindCard key={key} clusterName={clusterName} kind={key} label={label} result={workloads[key]} />
      ))}
    </div>
  );
}

interface WorkloadKindCardProps {
  clusterName: string;
  kind: WorkloadKind;
  label: string;
  result: UseWatchListResult<KubeObjectBase>;
}

function WorkloadKindCard({ clusterName, kind, label, result }: WorkloadKindCardProps) {
  const items = result.data.array;
  const slices = useMemo(() => bucketWorkload(items, kind), [items, kind]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-semibold">
          <Link to={PATH_K8S_LIST_FULL} params={{ clusterName, kind }} className="hover:underline">
            {label}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4 p-3 pt-1">
        <DonutCardBody
          slices={slices}
          isLoading={result.isLoading}
          size={92}
          thickness={11}
          centerValue={items.length}
          emptyText="No resources"
        />
      </CardContent>
    </Card>
  );
}
