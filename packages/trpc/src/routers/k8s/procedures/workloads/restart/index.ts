import { z } from "zod";
import {
  k8sResourceConfigSchema,
  k8sDeploymentConfig,
  k8sStatefulSetConfig,
  k8sDaemonSetConfig,
} from "@my-project/shared";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { kindEnumErrorMap } from "../../../utils/kindEnumErrorMap/index.js";
import { assertCanonicalResourceConfig } from "../../../utils/assertCanonicalResourceConfig/index.js";

// Kinds that own pods via spec.template and respond to the rolling-restart annotation.
// ReplicaSet is intentionally excluded — restart its owning Deployment instead.
const RESTARTABLE_KIND_ENUM = ["Deployment", "StatefulSet", "DaemonSet"] as const;

// Allowlist mapping each restartable kind to its canonical {group, version, pluralName}.
const RESTARTABLE_KIND_CANONICAL = {
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
  DaemonSet: {
    group: k8sDaemonSetConfig.group,
    version: k8sDaemonSetConfig.version,
    pluralName: k8sDaemonSetConfig.pluralName,
  },
} as const satisfies Record<
  (typeof RESTARTABLE_KIND_ENUM)[number],
  { group: string; version: string; pluralName: string }
>;

export const k8sRestartWorkloadProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema.extend({
        kind: z.enum(RESTARTABLE_KIND_ENUM, { errorMap: kindEnumErrorMap(RESTARTABLE_KIND_ENUM) }),
      }),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const k8sClient = getInitializedK8sClient(ctx);

      const { resourceConfig, name, namespace } = input;

      // Reject a valid kind paired with mismatched group/version/pluralName so the
      // PATCH cannot be routed to an arbitrary resource.
      assertCanonicalResourceConfig(resourceConfig, RESTARTABLE_KIND_CANONICAL);

      const body = {
        spec: {
          template: {
            metadata: {
              annotations: {
                "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
              },
            },
          },
        },
      };

      return await k8sClient.patchResource(resourceConfig, name, namespace, body, "strategic");
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
