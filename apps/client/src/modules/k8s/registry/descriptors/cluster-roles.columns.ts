import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, ageColumn } from "./columnHelpers";

export const clusterRoleColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  {
    id: "rules",
    label: "Rules",
    data: {
      render: ({ data }) => {
        const r = data as { rules?: unknown[] };
        return String(r.rules?.length ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
