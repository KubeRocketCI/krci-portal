import { K8sResourceConfig } from "../../../common/types.js";
import { codemieSecretLabels } from "./labels.js";

export const k8sCodemieConfig = {
  apiVersion: "edp.epam.com/v1alpha1",
  group: "edp.epam.com",
  version: "v1alpha1",
  kind: "Codemie",
  singularName: "codemie",
  pluralName: "codemies",
} as const satisfies K8sResourceConfig;
