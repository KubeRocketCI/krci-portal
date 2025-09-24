import { K8sResourceConfig } from "../../../common/types";

export const k8sCodemieProjectConfig = {
  apiVersion: "edp.epam.com/v1alpha1",
  group: "edp.epam.com",
  version: "v1alpha1",
  kind: "CodemieProject",
  singularName: "codemieproject",
  pluralName: "codemieprojects",
} as const satisfies K8sResourceConfig;
