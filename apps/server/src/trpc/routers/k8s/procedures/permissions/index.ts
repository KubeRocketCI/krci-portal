import * as k8s from "@kubernetes/client-node";
import { V1SelfSubjectAccessReview } from "@kubernetes/client-node";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/procedures/protected";
import {
  defaultPermissions,
  defaultPermissionsToCheck,
  PermissionsResult,
} from "@my-project/shared";

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
    const { apiVersion, group, version, namespace, resourcePlural } = input;
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new Error("K8sClient is not initialized");
    }

    const authApi = K8sClient.KubeConfig.makeApiClient(k8s.AuthorizationV1Api);

    const promises = defaultPermissionsToCheck.reduce<
      Promise<V1SelfSubjectAccessReview>[]
    >((acc, verb) => {
      acc.push(
        authApi.createSelfSubjectAccessReview({
          body: {
            apiVersion: `authorization.k8s.io/${apiVersion}`,
            spec: {
              resourceAttributes: {
                verb,
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

    const result = responses.reduce<PermissionsResult>((acc, res, index) => {
      const verb = defaultPermissionsToCheck[index];
      acc[verb] = {
        allowed: res.status?.allowed || false,
        reason: res.status?.reason || `You cannot ${verb} ${resourcePlural}`,
      };
      return acc;
    }, defaultPermissions);

    return result;
  });
