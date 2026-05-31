import { CircleCheck, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { Namespace } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

const isTerminating = (namespace: Namespace): boolean =>
  namespace.status?.phase === "Terminating" || !!namespace.metadata?.deletionTimestamp;

export const getNamespaceStatusIcon = (namespace: Namespace): K8sResourceStatusIcon => {
  if (isTerminating(namespace)) {
    return { component: LoaderCircle, color: STATUS_COLOR.MISSING, isSpinning: true };
  }
  if (namespace.status?.phase === "Active") {
    return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  }
  return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
};

export const getNamespaceStatusLabel = (namespace: Namespace): string => {
  if (isTerminating(namespace)) return "Terminating";
  if (namespace.status?.phase === "Active") return "Active";
  return "Unknown";
};
