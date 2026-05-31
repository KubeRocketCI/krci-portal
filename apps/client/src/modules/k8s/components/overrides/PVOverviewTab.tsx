import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getPVStatusIcon, getPVStatusLabel } from "@/k8s/api/groups/Core/PersistentVolume/utils/getStatus";
import type { KubeObjectBase, PersistentVolume } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface PVSpecView {
  capacity?: { storage?: string };
  accessModes?: string[];
  persistentVolumeReclaimPolicy?: string;
  storageClassName?: string;
  volumeMode?: string;
  claimRef?: { namespace?: string; name?: string };
}

const KNOWN_SPEC_KEYS = new Set([
  "capacity",
  "accessModes",
  "persistentVolumeReclaimPolicy",
  "storageClassName",
  "volumeMode",
  "claimRef",
  "mountOptions",
  "nodeAffinity",
  "volumeAttributesClassName",
]);

const detectVolumeSource = (spec: Record<string, unknown> | undefined): string | undefined => {
  if (!spec) return undefined;
  return Object.keys(spec).find((key) => !KNOWN_SPEC_KEYS.has(key));
};

export function PVOverviewTab({ item }: { item: KubeObjectBase }) {
  const pv = item as PersistentVolume;

  const spec = pv.spec as PVSpecView | undefined;
  const status = pv.status as { phase?: string } | undefined;
  const created = pv.metadata?.creationTimestamp;

  const capacity = spec?.capacity?.storage;
  const accessModes = spec?.accessModes ?? [];
  const reclaimPolicy = spec?.persistentVolumeReclaimPolicy;
  const storageClass = spec?.storageClassName;
  const volumeMode = spec?.volumeMode;
  const claimRef = spec?.claimRef;
  const volumeSource = detectVolumeSource(pv.spec as Record<string, unknown> | undefined);

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={<StatusBadge statusIcon={getPVStatusIcon(pv)} label={getPVStatusLabel(pv)} />}
          sub="Phase"
        />
        <WorkloadSummaryCard label="Capacity" value={capacity ?? "—"} sub="Storage" />
        <WorkloadSummaryCard
          label="Access Modes"
          value={accessModes.length ? accessModes.join(", ") : "—"}
          sub="Modes"
        />
        <WorkloadSummaryCard label="Reclaim Policy" value={reclaimPolicy ?? "—"} sub="Policy" />
        <WorkloadSummaryCard
          label="Storage Class"
          value={<span className="font-mono text-xs break-all">{storageClass ?? "—"}</span>}
          sub="Class"
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
          <WorkloadInformationCard>
            <WorkloadInfoRow label="Phase">{status?.phase ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Capacity">{capacity ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Access Modes">{accessModes.length ? accessModes.join(", ") : "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Reclaim Policy">{reclaimPolicy ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Storage Class" mono>
              {storageClass ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Volume Mode">{volumeMode ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Claim" mono>
              {claimRef ? `${claimRef.namespace}/${claimRef.name}` : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Volume Source">{volumeSource ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {pv.metadata?.uid ?? "—"}
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
