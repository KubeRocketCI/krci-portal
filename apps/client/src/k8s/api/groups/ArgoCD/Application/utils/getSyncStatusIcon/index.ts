import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { Application, applicationSyncStatus, getApplicationSyncStatus } from "@my-project/shared";
import { CheckCircle, CircleArrowUp, LoaderCircle, ShieldQuestion } from "lucide-react";

export const getSyncStatusIcon = (application: Application): K8sResourceStatusIcon => {
  const { status } = getApplicationSyncStatus(application);

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  switch (status) {
    case applicationSyncStatus.synced:
      return {
        component: CheckCircle,
        color: STATUS_COLOR.SUCCESS,
      };

    case applicationSyncStatus.outofsync:
      return {
        component: CircleArrowUp,
        color: STATUS_COLOR.MISSING,
      };

    default:
      return {
        component: LoaderCircle,
        color: STATUS_COLOR.UNKNOWN,
      };
  }
};
