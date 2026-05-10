import { K8sResourceConfig } from "../../../common/index.js";

export const k8sEventConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "Event",
  singularName: "event",
  pluralName: "events",
} as const satisfies K8sResourceConfig;
