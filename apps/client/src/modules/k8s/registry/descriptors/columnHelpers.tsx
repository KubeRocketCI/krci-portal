import type { ReactElement } from "react";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";

export type RenderName = (data: KubeObjectBase) => ReactElement | string | number | undefined | null;

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
