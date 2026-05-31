import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { ReplicaProgress } from "@/modules/k8s/components/workload";
import { getDaemonSetStatusIcon, getDaemonSetStatusLabel } from "@/k8s/api/groups/apps/DaemonSet/utils/getStatus";
import { makeNameColumn, makeStatusColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const daemonSetColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  makeStatusColumn(getDaemonSetStatusIcon, getDaemonSetStatusLabel),
  {
    id: "desired",
    label: "Desired",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { desiredNumberScheduled?: number } };
        return String(s.status?.desiredNumberScheduled ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "current",
    label: "Current",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { currentNumberScheduled?: number } };
        return String(s.status?.currentNumberScheduled ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "ready",
    label: "Ready",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { numberReady?: number; desiredNumberScheduled?: number } };
        return <ReplicaProgress ready={s.status?.numberReady ?? 0} desired={s.status?.desiredNumberScheduled ?? 0} />;
      },
    },
    cell: { baseWidth: 12 },
  },
  {
    id: "available",
    label: "Available",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { numberAvailable?: number } };
        return String(s.status?.numberAvailable ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
