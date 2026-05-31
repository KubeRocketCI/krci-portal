import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { ReplicaProgress } from "@/modules/k8s/components/workload";
import { getStatefulSetStatusIcon, getStatefulSetStatusLabel } from "@/k8s/api/groups/apps/StatefulSet/utils/getStatus";
import { makeNameColumn, makeStatusColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const statefulSetColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  makeStatusColumn(getStatefulSetStatusIcon, getStatefulSetStatusLabel),
  {
    id: "ready",
    label: "Ready",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { readyReplicas?: number }; spec?: { replicas?: number } };
        return <ReplicaProgress ready={s.status?.readyReplicas ?? 0} desired={s.spec?.replicas ?? 0} />;
      },
    },
    cell: { baseWidth: 12 },
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
