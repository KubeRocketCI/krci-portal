import type { ReactElement } from "react";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";
import type { K8sResourceStatusIcon } from "@/k8s/types";

export type RenderName = (data: KubeObjectBase) => ReactElement | string | number | undefined | null;

/**
 * Status column shared by every resource list descriptor. Each resource only
 * differs by its `getStatusIcon`/`getStatusLabel` pair, so the JSX lives here.
 */
export const makeStatusColumn = <T extends KubeObjectBase>(
  getStatusIcon: (data: T) => K8sResourceStatusIcon,
  getStatusLabel: (data: T) => string,
  baseWidth = 12
): TableColumn<KubeObjectBase> => ({
  id: "status",
  label: "Status",
  data: {
    render: ({ data }) => {
      const resource = data as T;
      const icon = getStatusIcon(resource);
      return (
        <div className="flex items-center gap-1.5">
          <StatusIcon Icon={icon.component} color={icon.color} isSpinning={icon.isSpinning} width={14} />
          <span className="text-sm">{getStatusLabel(resource)}</span>
        </div>
      );
    },
  },
  cell: { baseWidth },
});

export const makeNameColumn = (renderName: RenderName): TableColumn<KubeObjectBase> => ({
  id: "name",
  label: "Name",
  data: {
    render: ({ data }) => renderName(data),
    columnSortableValuePath: "metadata.name",
  },
  cell: { baseWidth: 20 },
});

export const namespaceColumn: TableColumn<KubeObjectBase> = {
  id: "namespace",
  label: "Namespace",
  data: {
    render: ({ data }) => <TextWithTooltip text={data.metadata?.namespace ?? "—"} />,
    columnSortableValuePath: "metadata.namespace",
  },
  cell: { baseWidth: 15 },
};

export const ageColumn: TableColumn<KubeObjectBase> = {
  id: "age",
  label: "Created at",
  data: {
    render: ({ data }) => {
      const ts = data.metadata?.creationTimestamp;
      if (!ts) return "—";
      return (
        <Tooltip title={formatUnixTimestamp(ts)} delayDuration={500}>
          <span className="text-sm">{formatTimestamp(ts)}</span>
        </Tooltip>
      );
    },
    columnSortableValuePath: "metadata.creationTimestamp",
  },
  cell: { baseWidth: 13 },
};
