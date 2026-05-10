import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const cronJobColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "schedule",
    label: "Schedule",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { schedule?: string } };
        return s.spec?.schedule ?? "—";
      },
    },
    cell: { baseWidth: 15 },
  },
  {
    id: "suspend",
    label: "Suspend",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { suspend?: boolean } };
        return s.spec?.suspend ? "Yes" : "No";
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "last-schedule",
    label: "Last Schedule",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { lastScheduleTime?: string } };
        return s.status?.lastScheduleTime ?? "—";
      },
    },
    cell: { baseWidth: 15 },
  },
  ageColumn,
];
