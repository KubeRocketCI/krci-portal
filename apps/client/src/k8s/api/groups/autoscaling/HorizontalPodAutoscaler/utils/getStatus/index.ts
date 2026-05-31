import { CircleCheck, LoaderCircle, ShieldQuestion, TriangleAlert } from "lucide-react";
import type { HorizontalPodAutoscaler } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface HPAStatusView {
  current: number;
  desired: number;
  max: number;
  scalingActive?: string;
  ableToScale?: string;
  scalingLimited?: string;
  terminating: boolean;
}

const readStatus = (hpa: HorizontalPodAutoscaler): HPAStatusView => {
  const spec = hpa.spec as { maxReplicas?: number } | undefined;
  const status = hpa.status as
    | { currentReplicas?: number; desiredReplicas?: number; conditions?: Array<{ type?: string; status?: string }> }
    | undefined;
  const conditions = status?.conditions ?? [];
  const conditionStatus = (type: string) => conditions.find((c) => c.type === type)?.status;
  return {
    current: status?.currentReplicas ?? 0,
    desired: status?.desiredReplicas ?? 0,
    max: spec?.maxReplicas ?? 0,
    scalingActive: conditionStatus("ScalingActive"),
    ableToScale: conditionStatus("AbleToScale"),
    scalingLimited: conditionStatus("ScalingLimited"),
    terminating: !!hpa.metadata?.deletionTimestamp,
  };
};

export const getHPAStatusIcon = (hpa: HorizontalPodAutoscaler): K8sResourceStatusIcon => {
  const s = readStatus(hpa);
  if (s.terminating) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  if (s.scalingActive === "False") return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
  if ((s.scalingLimited === "True" || (s.max > 0 && s.current >= s.max)) && s.scalingActive !== "False") {
    return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
  }
  if (s.ableToScale === "True" && s.scalingActive === "True") {
    return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  }
  if (s.current === s.desired) return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
};

export const getHPAStatusLabel = (hpa: HorizontalPodAutoscaler): string => {
  const s = readStatus(hpa);
  if (s.terminating) return "Terminating";
  if (s.scalingActive === "False") return "Inactive";
  if ((s.scalingLimited === "True" || (s.max > 0 && s.current >= s.max)) && s.scalingActive !== "False") {
    return "Limited";
  }
  if (s.ableToScale === "True" && s.scalingActive === "True") return "Active";
  if (s.current === s.desired) return "Active";
  return "Scaling";
};
