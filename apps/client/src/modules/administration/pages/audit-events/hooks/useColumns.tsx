import { useMemo } from "react";
import { Tooltip } from "@/core/components/ui/tooltip";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";
import type { TableColumn } from "@/core/components/Table/types";
import type { KrciAuditEvent } from "@my-project/shared";

export function useColumns(): TableColumn<KrciAuditEvent>[] {
  return useMemo(
    () => [
      {
        id: "receivedAt",
        label: "Timestamp",
        data: {
          render: ({ data }) => {
            if (!data.receivedAt) return "—";
            return (
              <Tooltip title={formatUnixTimestamp(data.receivedAt)} delayDuration={500}>
                <span className="text-sm whitespace-nowrap">{formatTimestamp(data.receivedAt)}</span>
              </Tooltip>
            );
          },
          columnSortableValuePath: "receivedAt",
        },
        cell: { baseWidth: 13 },
      },
      {
        id: "username",
        label: "Actor",
        data: {
          render: ({ data }) => <TextWithTooltip text={data.username ?? "—"} />,
          columnSortableValuePath: "username",
        },
        cell: { baseWidth: 18 },
      },
      {
        id: "operation",
        label: "Operation",
        data: {
          render: ({ data }) => data.operation ?? "—",
          columnSortableValuePath: "operation",
        },
        cell: { baseWidth: 10 },
      },
      {
        id: "kind",
        label: "Kind",
        data: {
          render: ({ data }) => <TextWithTooltip text={data.kind ?? "—"} />,
          columnSortableValuePath: "kind",
        },
        cell: { baseWidth: 14 },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: {
          render: ({ data }) => <TextWithTooltip text={data.namespace ?? "—"} />,
          columnSortableValuePath: "namespace",
        },
        cell: { baseWidth: 14 },
      },
      {
        id: "name",
        label: "Name",
        data: {
          render: ({ data }) => <TextWithTooltip text={data.name ?? "—"} />,
          columnSortableValuePath: "name",
        },
        cell: { baseWidth: 20 },
      },
    ],
    []
  );
}
