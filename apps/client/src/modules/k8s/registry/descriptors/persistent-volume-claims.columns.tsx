import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { getPVCStatusIcon, getPVCStatusLabel } from "@/k8s/api/groups/Core/PersistentVolumeClaim/utils/getStatus";
import { makeNameColumn, makeStatusColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const persistentVolumeClaimColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  makeStatusColumn(getPVCStatusIcon, getPVCStatusLabel),
  {
    id: "volume",
    label: "Volume",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { volumeName?: string } };
        return <TextWithTooltip text={s.spec?.volumeName ?? "—"} />;
      },
    },
    cell: { baseWidth: 16 },
  },
  {
    id: "capacity",
    label: "Capacity",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { capacity?: { storage?: string } } };
        return s.status?.capacity?.storage ?? "—";
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
  ageColumn,
];
