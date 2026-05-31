import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { ReplicaProgress } from "@/modules/k8s/components/workload";
import { getDeploymentStatusIcon, getDeploymentStatusLabel } from "@/k8s/api/groups/apps/Deployment/utils/getStatus";
import { makeNameColumn, makeStatusColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const deploymentColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  makeStatusColumn(getDeploymentStatusIcon, getDeploymentStatusLabel),
  {
    id: "ready",
    label: "Ready",
    data: {
      render: ({ data }) => {
        const d = data as { status?: { readyReplicas?: number }; spec?: { replicas?: number } };
        return <ReplicaProgress ready={d.status?.readyReplicas ?? 0} desired={d.spec?.replicas ?? 0} />;
      },
    },
    cell: { baseWidth: 12 },
  },
  {
    id: "up-to-date",
    label: "Up-to-date",
    data: {
      render: ({ data }) => {
        const d = data as { status?: { updatedReplicas?: number } };
        return String(d.status?.updatedReplicas ?? 0);
      },
    },
    cell: { baseWidth: 12 },
  },
  {
    id: "available",
    label: "Available",
    data: {
      render: ({ data }) => {
        const d = data as { status?: { availableReplicas?: number } };
        return String(d.status?.availableReplicas ?? 0);
      },
    },
    cell: { baseWidth: 12 },
  },
  {
    id: "image",
    label: "Image",
    data: {
      render: ({ data }) => {
        const d = data as { spec?: { template?: { spec?: { containers?: Array<{ image?: string }> } } } };
        return <TextWithTooltip text={d.spec?.template?.spec?.containers?.[0]?.image ?? "—"} />;
      },
    },
    cell: { baseWidth: 18 },
  },
  ageColumn,
];
