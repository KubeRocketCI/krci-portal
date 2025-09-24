import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { codemieProjectSettingsStatus, CodemieProjectSettings } from "@my-project/shared";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";

export const getCodemieProjectSettingsStatusIcon = (
  codemieProjectSettings: CodemieProjectSettings | undefined
): K8sResourceStatusIcon => {
  const status = codemieProjectSettings?.status?.value;

  if (!status) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case codemieProjectSettingsStatus.created:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case codemieProjectSettingsStatus.error:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    default:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
  }
};
