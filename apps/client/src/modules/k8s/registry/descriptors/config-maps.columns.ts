import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const configMapColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "data",
    label: "Data",
    data: {
      render: ({ data }) => {
        const d = data as { data?: Record<string, string> };
        return String(Object.keys(d.data ?? {}).length);
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
