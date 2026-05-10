import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const statefulSetColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "ready",
    label: "Ready",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { readyReplicas?: number }; spec?: { replicas?: number } };
        return `${s.status?.readyReplicas ?? 0}/${s.spec?.replicas ?? 0}`;
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "up-to-date",
    label: "Up-to-date",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { updatedReplicas?: number } };
        return String(s.status?.updatedReplicas ?? 0);
      },
    },
    cell: { baseWidth: 12 },
  },
  {
    id: "service",
    label: "Service",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { serviceName?: string } };
        return <TextWithTooltip text={s.spec?.serviceName ?? "—"} />;
      },
    },
    cell: { baseWidth: 15 },
  },
  {
    id: "image",
    label: "Image",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { template?: { spec?: { containers?: Array<{ image?: string }> } } } };
        return <TextWithTooltip text={s.spec?.template?.spec?.containers?.[0]?.image ?? "—"} />;
      },
    },
    cell: { baseWidth: 18 },
  },
  ageColumn,
];
