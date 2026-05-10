import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, ageColumn } from "./columnHelpers";

export const namespaceColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  {
    id: "status",
    label: "Status",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { phase?: string } };
        return s.status?.phase ?? "—";
      },
    },
    cell: { baseWidth: 12 },
  },
  ageColumn,
];
