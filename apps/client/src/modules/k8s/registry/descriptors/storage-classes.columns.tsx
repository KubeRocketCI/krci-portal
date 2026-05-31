import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, ageColumn } from "./columnHelpers";

const DEFAULT_CLASS_ANNOTATION = "storageclass.kubernetes.io/is-default-class";

export const storageClassColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  {
    id: "provisioner",
    label: "Provisioner",
    data: {
      render: ({ data }) => {
        const s = data as { provisioner?: string };
        return <TextWithTooltip text={s.provisioner ?? "—"} />;
      },
    },
    cell: { baseWidth: 20 },
  },
  {
    id: "reclaim-policy",
    label: "Reclaim Policy",
    data: {
      render: ({ data }) => {
        const s = data as { reclaimPolicy?: string };
        return s.reclaimPolicy ?? "—";
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "volume-binding-mode",
    label: "Volume Binding Mode",
    data: {
      render: ({ data }) => {
        const s = data as { volumeBindingMode?: string };
        return s.volumeBindingMode ?? "—";
      },
    },
    cell: { baseWidth: 20 },
  },
  {
    id: "default",
    label: "Default",
    data: {
      render: ({ data }) => {
        const isDefault = data.metadata?.annotations?.[DEFAULT_CLASS_ANNOTATION] === "true";
        return isDefault ? "Yes" : "No";
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
