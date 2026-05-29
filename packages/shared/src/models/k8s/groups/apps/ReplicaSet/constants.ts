import { K8sResourceConfig } from "../../../common/index.js";

export const k8sReplicaSetConfig = {
  group: "apps",
  version: "v1",
  apiVersion: "apps/v1",
  kind: "ReplicaSet",
  singularName: "replicaset",
  pluralName: "replicasets",
} as const satisfies K8sResourceConfig;

// Annotation written by the Deployment controller onto each owned ReplicaSet (and
// onto the Deployment itself) to track the rollout revision number. Used by the
// rollback + listRevisions procedures to identify the current revision.
export const DEPLOYMENT_REVISION_ANNOTATION = "deployment.kubernetes.io/revision";
