import { K8sResourceConfig } from "../../../common/types";
import { codemieProjectSettingsStatusEnum } from "./schema";

export const k8sCodemieProjectSettingsConfig = {
  apiVersion: "edp.epam.com/v1alpha1",
  group: "edp.epam.com",
  version: "v1alpha1",
  kind: "CodemieProjectSettings",
  singularName: "codemieprojectsettings",
  pluralName: "codemieprojectsettings",
} as const satisfies K8sResourceConfig;

export const codemieProjectSettingsStatus = codemieProjectSettingsStatusEnum.enum;
