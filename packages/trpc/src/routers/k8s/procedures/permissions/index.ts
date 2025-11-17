import { AuthorizationV1Api } from "@kubernetes/client-node";
import { V1SelfSubjectAccessReview } from "@kubernetes/client-node";
import { z } from "zod";
import { handleK8sError } from "../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import {
  defaultPermissions,
  defaultPermissionsToCheck,
  DefaultPermissionListCheckResult,
  k8sToRbacVerbMap,
} from "@my-project/shared";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors/index.js";
import { TRPCError } from "@trpc/server";
import { K8sClient } from "packages/trpc/src/clients/k8s";

export const k8sGetResourcePermissions = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      apiVersion: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const { apiVersion, group, version, namespace, resourcePlural } = input;
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const authApi = k8sClient.KubeConfig.makeApiClient(AuthorizationV1Api);

      const promises = defaultPermissionsToCheck.reduce<Promise<V1SelfSubjectAccessReview>[]>((acc, verb) => {
        const rbacVerb = k8sToRbacVerbMap[verb];

        acc.push(
          authApi.createSelfSubjectAccessReview({
            body: {
              apiVersion: `authorization.k8s.io/${apiVersion}`,
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
          reason: res.status?.reason || `You cannot ${verb} ${resourcePlural}`,
        };
        return acc;
      }, defaultPermissions);

      return result;
    } catch (error) {
      throw handleK8sError(error);
    }
  });
