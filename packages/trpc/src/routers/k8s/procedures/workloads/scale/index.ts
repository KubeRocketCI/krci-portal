import { z } from "zod";
import {
  k8sResourceConfigSchema,
  k8sDeploymentConfig,
  k8sStatefulSetConfig,
  k8sReplicaSetConfig,
} from "@my-project/shared";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { kindEnumErrorMap } from "../../../utils/kindEnumErrorMap/index.js";
import { assertCanonicalResourceConfig } from "../../../utils/assertCanonicalResourceConfig/index.js";

const MAX_REPLICAS = 10_000;

// Kinds that expose the /scale subresource per the Kubernetes API.
// Other kinds (DaemonSet, Job, etc.) will 404 against /scale.
const SCALABLE_KIND_ENUM = ["Deployment", "StatefulSet", "ReplicaSet", "ReplicationController"] as const;

// Allowlist mapping each scalable kind to its canonical {group, version, pluralName}.
// ReplicationController lives in the core API group (empty group string).
const SCALABLE_KIND_CANONICAL = {
  Deployment: {
    group: k8sDeploymentConfig.group,
    version: k8sDeploymentConfig.version,
    pluralName: k8sDeploymentConfig.pluralName,
  },
  StatefulSet: {
    group: k8sStatefulSetConfig.group,
    version: k8sStatefulSetConfig.version,
    pluralName: k8sStatefulSetConfig.pluralName,
  },
  ReplicaSet: {
    group: k8sReplicaSetConfig.group,
    version: k8sReplicaSetConfig.version,
    pluralName: k8sReplicaSetConfig.pluralName,
  },
  // Core API group: group is empty string, apiVersion is "v1"
  ReplicationController: { group: "", version: "v1", pluralName: "replicationcontrollers" },
} as const satisfies Record<
  (typeof SCALABLE_KIND_ENUM)[number],
  { group: string; version: string; pluralName: string }
>;

export const k8sScaleWorkloadProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema.extend({
        kind: z.enum(SCALABLE_KIND_ENUM, { errorMap: kindEnumErrorMap(SCALABLE_KIND_ENUM) }),
      }),
      replicas: z.number().int().min(0).max(MAX_REPLICAS),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const k8sClient = getInitializedK8sClient(ctx);

      const { resourceConfig, name, namespace, replicas } = input;

      // Reject a valid kind paired with mismatched group/version/pluralName so the
      // PATCH cannot be routed to an arbitrary resource.
      assertCanonicalResourceConfig(resourceConfig, SCALABLE_KIND_CANONICAL);

      // The /scale subresource accepts only merge-patch or json-patch —
      // strategic merge patch is not supported on subresources (K8s returns 415).
      return await k8sClient.patchResource(resourceConfig, name, namespace, { spec: { replicas } }, "merge", "scale");
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
