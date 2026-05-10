import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const secretColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "type",
    label: "Type",
    data: {
      render: ({ data }) => {
        const s = data as { type?: string };
        return <TextWithTooltip text={s.type ?? "—"} />;
      },
    },
    cell: { baseWidth: 20 },
  },
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
