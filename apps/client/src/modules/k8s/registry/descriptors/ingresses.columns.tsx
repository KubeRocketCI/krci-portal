import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const ingressColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "class",
    label: "Class",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { ingressClassName?: string } };
        return s.spec?.ingressClassName ?? "—";
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "hosts",
    label: "Hosts",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { rules?: Array<{ host?: string }> } };
        return (
          <TextWithTooltip
            text={
              s.spec?.rules
                ?.map((r) => r.host)
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
        );
      },
    },
    cell: { baseWidth: 20 },
  },
  {
    id: "address",
    label: "Address",
    data: {
      render: ({ data }) => {
        const s = data as {
          status?: { loadBalancer?: { ingress?: Array<{ ip?: string; hostname?: string }> } };
        };
        return (
          <TextWithTooltip
            text={
              s.status?.loadBalancer?.ingress
                ?.map((i) => i.ip || i.hostname)
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
        );
      },
    },
    cell: { baseWidth: 16 },
  },
  ageColumn,
];
