import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { getNamespaceStatusIcon, getNamespaceStatusLabel } from "@/k8s/api/groups/Core/Namespace/utils/getStatus";
import { makeNameColumn, makeStatusColumn, ageColumn } from "./columnHelpers";

export const namespaceColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  makeStatusColumn(getNamespaceStatusIcon, getNamespaceStatusLabel),
  {
    id: "phase",
    label: "Phase",
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
