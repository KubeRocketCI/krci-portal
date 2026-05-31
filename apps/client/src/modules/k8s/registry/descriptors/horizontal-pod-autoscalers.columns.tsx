import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import {
  getHPAStatusIcon,
  getHPAStatusLabel,
} from "@/k8s/api/groups/autoscaling/HorizontalPodAutoscaler/utils/getStatus";
import { makeNameColumn, makeStatusColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const horizontalPodAutoscalerColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  makeStatusColumn(getHPAStatusIcon, getHPAStatusLabel),
  {
    id: "target",
    label: "Scale Target",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { scaleTargetRef?: { kind?: string; name?: string } } };
        const ref = s.spec?.scaleTargetRef;
        return ref?.name ?? "—";
      },
    },
    cell: { baseWidth: 18 },
  },
  {
    id: "min",
    label: "Min",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { minReplicas?: number } };
        return String(s.spec?.minReplicas ?? "—");
      },
    },
    cell: { baseWidth: 8 },
  },
  {
    id: "max",
    label: "Max",
    data: {
      render: ({ data }) => {
        const s = data as { spec?: { maxReplicas?: number } };
        return String(s.spec?.maxReplicas ?? "—");
      },
    },
    cell: { baseWidth: 8 },
  },
  {
    id: "replicas",
    label: "Replicas",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { currentReplicas?: number } };
        return String(s.status?.currentReplicas ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
