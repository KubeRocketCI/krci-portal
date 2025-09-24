import { K8sResourceConfig } from "../../../common/types";
import { codemieApplicationStatusEnum } from "./schema";

export const k8sCodemieApplicationConfig = {
  apiVersion: "edp.epam.com/v1alpha1",
  group: "edp.epam.com",
  version: "v1alpha1",
  kind: "CodemieApplication",
  singularName: "codemieApplication",
  pluralName: "codemieApplication",
} as const satisfies K8sResourceConfig;

export const codemieApplicationStatus = codemieApplicationStatusEnum.enum;
