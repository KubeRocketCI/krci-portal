import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const roleColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
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
