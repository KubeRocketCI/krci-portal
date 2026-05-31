import { useMemo } from "react";
import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getPVCStatusIcon, getPVCStatusLabel } from "@/k8s/api/groups/Core/PersistentVolumeClaim/utils/getStatus";
import { k8sPodConfig } from "@my-project/shared";
import type { KubeObjectBase, PersistentVolumeClaim, Pod } from "@my-project/shared";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadPodsCard,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface PVCSpecView {
  accessModes?: string[];
  storageClassName?: string;
  volumeName?: string;
  volumeMode?: string;
  resources?: { requests?: { storage?: string } };
}

interface PVCStatusView {
  phase?: string;
  capacity?: { storage?: string };
}

export function PVCOverviewTab({ item }: { item: KubeObjectBase }) {
  const pvc = item as PersistentVolumeClaim;

  const spec = pvc.spec as PVCSpecView | undefined;
  const status = pvc.status as PVCStatusView | undefined;
  const created = pvc.metadata?.creationTimestamp;
  const namespace = pvc.metadata?.namespace ?? "";
  const pvcName = pvc.metadata?.name;

  const accessModes = spec?.accessModes ?? [];
  const accessModesText = accessModes.length ? accessModes.join(", ") : "—";
  const capacity = status?.capacity?.storage ?? spec?.resources?.requests?.storage ?? "—";

  const { data, isLoading } = useK8sResourceList<Pod>(k8sPodConfig, namespace);
  const allPods = data.array;

  const usedByPods = useMemo(() => {
    if (!pvcName) return [];
    return allPods.filter((pod) =>
      (
        (pod.spec as { volumes?: Array<{ persistentVolumeClaim?: { claimName?: string } }> } | undefined)?.volumes ?? []
      ).some((v) => v.persistentVolumeClaim?.claimName === pvcName)
    );
  }, [allPods, pvcName]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={<StatusBadge statusIcon={getPVCStatusIcon(pvc)} label={getPVCStatusLabel(pvc)} />}
          sub="Phase"
        />
        <WorkloadSummaryCard label="Capacity" value={capacity} sub="Storage" />
        <WorkloadSummaryCard label="Access Modes" value={accessModesText} sub="Modes" />
        <WorkloadSummaryCard
          label="Storage Class"
          value={<span className="font-mono text-sm">{spec?.storageClassName ?? "—"}</span>}
          sub="Class"
        />
        <WorkloadSummaryCard
          label="Volume"
          value={<span className="font-mono text-sm">{spec?.volumeName ?? "—"}</span>}
          sub="Bound PV"
        />
        <WorkloadSummaryCard
          label="Created"
          value={formatRelativeTime(created)}
          sub={
            created ? (
              <Tooltip title={created}>
                <span>{formatTimestamp(created)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
      </WorkloadSummaryGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <WorkloadPodsCard pods={usedByPods} isLoading={isLoading} emptyText="No pods are using this claim." />
          <WorkloadInformationCard>
            <WorkloadInfoRow label="Phase">{status?.phase ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Volume Mode">{spec?.volumeMode ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Access Modes">{accessModesText}</WorkloadInfoRow>
            <WorkloadInfoRow label="Storage Class" mono>
              {spec?.storageClassName ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Volume Name" mono>
              {spec?.volumeName ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Requested storage">{spec?.resources?.requests?.storage ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Capacity">{status?.capacity?.storage ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {pvc.metadata?.uid ?? "—"}
            </WorkloadInfoRow>
          </WorkloadInformationCard>
        </div>
        <div className="lg:col-span-1">
          <WorkloadOverviewSidebar item={item} />
        </div>
      </div>
    </div>
  );
}
