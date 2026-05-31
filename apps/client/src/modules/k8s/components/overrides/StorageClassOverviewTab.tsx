import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { KubeObjectBase, StorageClass } from "@my-project/shared";
import {
  MetadataCard,
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface StorageClassView {
  allowVolumeExpansion?: boolean;
}

const DEFAULT_CLASS_ANNOTATION = "storageclass.kubernetes.io/is-default-class";

export function StorageClassOverviewTab({ item }: { item: KubeObjectBase }) {
  const sc = item as StorageClass;
  const view = item as StorageClassView;

  const created = sc.metadata?.creationTimestamp;
  const annotations = sc.metadata?.annotations ?? {};
  const isDefault = annotations[DEFAULT_CLASS_ANNOTATION] === "true";
  const allowVolumeExpansion = view.allowVolumeExpansion;

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Default" value={isDefault ? "Yes" : "No"} sub="Default class" />
        <WorkloadSummaryCard
          label="Provisioner"
          value={<span className="font-mono text-xs">{sc.provisioner ?? "—"}</span>}
          sub="Driver"
        />
        <WorkloadSummaryCard label="Volume Binding Mode" value={sc.volumeBindingMode ?? "—"} sub="Binding" />
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
            <WorkloadInfoRow label="Provisioner" mono>
              {sc.provisioner ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Reclaim Policy">{sc.reclaimPolicy ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Volume Binding Mode">{sc.volumeBindingMode ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Allow Volume Expansion">
              {allowVolumeExpansion === undefined ? "—" : allowVolumeExpansion ? "Yes" : "No"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Default">{isDefault ? "Yes" : "No"}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {sc.metadata?.uid ?? "—"}
            </WorkloadInfoRow>
          </WorkloadInformationCard>
          <MetadataCard title="Parameters" entries={sc.parameters ?? {}} />
        </div>
        <div className="lg:col-span-1">
          <WorkloadOverviewSidebar item={item} />
        </div>
      </div>
    </div>
  );
}
