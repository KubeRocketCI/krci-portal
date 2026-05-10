import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, ageColumn } from "./columnHelpers";

export const clusterRoleBindingColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  {
    id: "role",
    label: "Role",
    data: {
      render: ({ data }) => {
        const r = data as { roleRef?: { kind?: string; name?: string } };
        return <TextWithTooltip text={r.roleRef ? `${r.roleRef.kind}/${r.roleRef.name}` : "—"} />;
      },
    },
    cell: { baseWidth: 20 },
  },
  {
    id: "subjects",
    label: "Subjects",
    data: {
      render: ({ data }) => {
        const r = data as { subjects?: unknown[] };
        return String(r.subjects?.length ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
