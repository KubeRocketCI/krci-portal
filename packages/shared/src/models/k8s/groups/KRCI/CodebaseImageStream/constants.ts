import { K8sResourceConfig } from "../../../core/types";

export const k8sCodebaseImageStreamConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  group: "v2.edp.epam.com",
  version: "v1",
  kind: "CodebaseImageStream",
  singularName: "codebaseimagestream",
  pluralName: "codebaseimagestreams",
} as const satisfies K8sResourceConfig;
