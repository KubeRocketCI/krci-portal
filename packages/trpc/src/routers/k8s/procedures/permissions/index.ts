import { AuthorizationV1Api } from "@kubernetes/client-node";
import { V1SelfSubjectAccessReview } from "@kubernetes/client-node";
import { z } from "zod";
import { rethrowOrHandleK8sError } from "../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import {
  defaultPermissions,
  defaultPermissionsToCheck,
  DefaultPermissionListCheckResult,
  k8sToRbacVerbMap,
} from "@my-project/shared";
import { getInitializedK8sClient } from "../../utils/getInitializedK8sClient/index.js";

export const k8sGetResourcePermissions = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const { group, version, namespace, resourcePlural } = input;
      const k8sClient = getInitializedK8sClient(ctx);

      const authApi = k8sClient.KubeConfig.makeApiClient(AuthorizationV1Api);

      const promises = defaultPermissionsToCheck.reduce<Promise<V1SelfSubjectAccessReview>[]>((acc, verb) => {
        const rbacVerb = k8sToRbacVerbMap[verb];

        acc.push(
          authApi.createSelfSubjectAccessReview({
            body: {
              // The SSARS object's own GVK is always authorization.k8s.io/v1 — it
              // identifies the review request, not the target resource. The target
              // GVR is conveyed via spec.resourceAttributes below.
              apiVersion: "authorization.k8s.io/v1",
              kind: "SelfSubjectAccessReview",
              spec: {
                resourceAttributes: {
                  verb: rbacVerb,
                  namespace,
                  group,
                  version,
                  resource: resourcePlural,
                },
              },
            },
          })
        );
        return acc;
      }, []);

      const responses = await Promise.all(promises);

      const result = responses.reduce<DefaultPermissionListCheckResult>((acc, res, index) => {
        const verb = defaultPermissionsToCheck[index];
        acc[verb] = {
          allowed: res.status?.allowed || false,
          reason: res.status?.reason ?? `You cannot ${verb} ${resourcePlural}`,
        };
        return acc;
      }, structuredClone(defaultPermissions));

      return result;
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
