import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const serviceColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "type",
    label: "Type",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { type?: string } };
        return s.spec?.type ?? "—";
      },
    },
    cell: { baseWidth: 12 },
  },
  {
    id: "cluster-ip",
    label: "ClusterIP",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { clusterIP?: string } };
        return <TextWithTooltip text={s.spec?.clusterIP ?? "—"} />;
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "ports",
    label: "Ports",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { ports?: Array<{ port?: number; protocol?: string }> } };
        return (
          <TextWithTooltip text={s.spec?.ports?.map((p) => `${p.port}/${p.protocol ?? "TCP"}`).join(", ") ?? "—"} />
        );
      },
    },
    cell: { baseWidth: 18 },
  },
  ageColumn,
];
