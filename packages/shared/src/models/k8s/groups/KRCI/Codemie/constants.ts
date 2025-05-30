import { K8sResourceConfig } from "../../../core/types";

export const codemieSecretLabels = {
  secretType: "app.edp.epam.com/secret-type",
} as const;

export const k8sCodemieConfig = {
  apiVersion: "edp.epam.com/v1alpha1",
  group: "edp.epam.com",
  version: "v1alpha1",
  kind: "Codemie",
  singularName: "codemie",
  pluralName: "codemies",
} as const satisfies K8sResourceConfig;
