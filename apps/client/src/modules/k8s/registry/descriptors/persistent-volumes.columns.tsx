import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, ageColumn } from "./columnHelpers";

export const persistentVolumeColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
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
  {
    id: "capacity",
    label: "Capacity",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { capacity?: { storage?: string } } };
        return s.spec?.capacity?.storage ?? "—";
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "access-modes",
    label: "Access Modes",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { accessModes?: string[] } };
        return s.spec?.accessModes?.join(", ") ?? "—";
      },
    },
    cell: { baseWidth: 16 },
  },
  {
    id: "reclaim-policy",
    label: "Reclaim Policy",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { persistentVolumeReclaimPolicy?: string } };
        return s.spec?.persistentVolumeReclaimPolicy ?? "—";
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "storage-class",
    label: "StorageClass",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { storageClassName?: string } };
        return s.spec?.storageClassName ?? "—";
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "claim",
    label: "Claim",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { claimRef?: { namespace?: string; name?: string } } };
        const ref = s.spec?.claimRef;
        return <TextWithTooltip text={ref ? `${ref.namespace}/${ref.name}` : "—"} />;
      },
    },
    cell: { baseWidth: 18 },
  },
  ageColumn,
];
