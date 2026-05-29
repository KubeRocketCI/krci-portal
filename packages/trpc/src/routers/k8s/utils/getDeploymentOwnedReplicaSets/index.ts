import { TRPCError } from "@trpc/server";
import { DEPLOYMENT_REVISION_ANNOTATION, k8sDeploymentConfig, k8sReplicaSetConfig } from "@my-project/shared";
import type { InitializedK8sClient } from "../getInitializedK8sClient/index.js";
import { createLabelSelectorString } from "../createLabelSelectorString/index.js";

export interface OwnedReplicaSet {
  metadata: {
    name: string;
    uid: string;
    creationTimestamp: string;
    annotations?: Record<string, string>;
    ownerReferences?: Array<{ kind?: string; uid?: string; controller?: boolean }>;
  };
  spec?: {
    template?: {
      metadata?: { labels?: Record<string, string> };
      spec?: { containers?: Array<{ image?: string }> };
    };
  };
}

export interface DeploymentOwnedReplicaSets {
  deploymentUid: string;
  /** The Deployment's `deployment.kubernetes.io/revision` annotation, if present. */
  currentRevision: string | undefined;
  items: OwnedReplicaSet[];
  /** Pagination continue token when `listAllResources` hit its maxPages cap. */
  listContinue: string | undefined;
}

/**
 * Fetches a Deployment and the ReplicaSets selected by its
 * `spec.selector.matchLabels`, the shared first half of both `rollback` and
 * `listRevisions`. Narrowing the RS list by the Deployment's matchLabels avoids a
 * namespace-wide scan; callers still apply {@link isControlledBy} to confirm
 * ownership before acting on a ReplicaSet. Throws TRPCError NOT_FOUND when the
 * Deployment is missing or has no UID.
 */
export async function getDeploymentOwnedReplicaSets(
  k8sClient: InitializedK8sClient,
  name: string,
  namespace: string
): Promise<DeploymentOwnedReplicaSets> {
  const deployment = (await k8sClient.getResource(k8sDeploymentConfig, name, namespace)) as {
    metadata: { uid?: string; annotations?: Record<string, string> };
    spec?: { selector?: { matchLabels?: Record<string, string> } };
  };
  const deploymentUid = deployment.metadata?.uid;
  if (!deploymentUid) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Deployment not found or missing UID",
    });
  }

  const currentRevision = deployment.metadata?.annotations?.[DEPLOYMENT_REVISION_ANNOTATION];
  const labelSelector = createLabelSelectorString(deployment.spec?.selector?.matchLabels);

  const list = (await k8sClient.listAllResources(k8sReplicaSetConfig, namespace, labelSelector)) as {
    items: OwnedReplicaSet[];
    metadata?: { continue?: string };
  };

  return { deploymentUid, currentRevision, items: list.items, listContinue: list.metadata?.continue };
}
