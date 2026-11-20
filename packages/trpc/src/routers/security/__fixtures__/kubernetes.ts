import type { AuthorizedStage } from "../authorization.js";

/** The Kubernetes resources of the portal namespace as the API serves them. */
export const DEMO_CD_PIPELINE = { metadata: { name: "demo" }, spec: { applications: ["my-service", "worker"] } };

export const DEMO_DEV_STAGE = {
  spec: { cdPipeline: "demo", name: "dev", namespace: "krci-demo-dev", clusterName: "in-cluster" },
  status: { available: true },
};

export const MY_SERVICE_IMAGE_STREAM = {
  metadata: { name: "my-service-main" },
  spec: { codebase: "my-service", imageName: "r.io/my-service" },
};

export const WORKER_IMAGE_STREAM = {
  metadata: { name: "worker-main" },
  spec: { codebase: "worker", imageName: "docker.io/library/worker" },
};

/** What the security code makes of the resources above. */
export const AUTHORIZED_DEV_STAGE: AuthorizedStage = {
  cdPipeline: "demo",
  stage: "dev",
  clusterName: "in-cluster",
  namespace: "krci-demo-dev",
  available: true,
};

export const DEMO_IMAGES = new Map([
  ["my-service", new Set(["oci-image:r.io/my-service"])],
  ["worker", new Set(["oci-image:worker"])],
]);

interface KubernetesLists {
  CDPipeline?: unknown[];
  Stage?: unknown[];
  CodebaseImageStream?: unknown[];
}

export const DEMO_LISTS: KubernetesLists = {
  CDPipeline: [DEMO_CD_PIPELINE],
  Stage: [DEMO_DEV_STAGE],
  CodebaseImageStream: [MY_SERVICE_IMAGE_STREAM, WORKER_IMAGE_STREAM],
};

/** A `listResource` that answers with the items of the kind that is asked for. */
export function listByKind(lists: KubernetesLists) {
  return async (config: { kind: string }) => ({ items: lists[config.kind as keyof KubernetesLists] ?? [] });
}
