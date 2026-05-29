import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { k8sConfigMapConfig, ConfigMap, krciConfigMapNames } from "@my-project/shared";
import z from "zod";
import { getInitializedK8sClient } from "../../utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../utils/handleK8sError/index.js";

export const kubeRootConfigName = "kube-root-ca.crt";

export const k8sGetKubeConfig = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace } = input;
    const k8sClient = getInitializedK8sClient(ctx);

    try {
      const currentCluster = k8sClient.KubeConfig.getCurrentCluster();
      const currentUser = k8sClient.KubeConfig.getCurrentUser();

      if (!currentCluster || !currentUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid KubeConfig: missing cluster or user info",
        });
      }

      const token = currentUser.token || ctx.session.user?.secret?.accessToken;
      const tokenExpiresAt = ctx.session.user?.secret?.accessTokenExpiresAt;

      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No token found for user",
        });
      }

      const { name: clusterName, caData } = currentCluster;

      const configMapList = await k8sClient.listResource(k8sConfigMapConfig, namespace);

      const configMaps = (configMapList.items || []) as ConfigMap[];

      let caCrtBase64: string;
      if (caData && typeof caData === "string") {
        caCrtBase64 = caData.startsWith("-----") ? globalThis.btoa(caData) : caData;
      } else {
        const kubeRootConfigMap = configMaps.find((i) => i.metadata.name === kubeRootConfigName);

        if (!kubeRootConfigMap) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Kube root config map "${kubeRootConfigName}" not found in namespace "${namespace}"`,
          });
        }

        const caCrt = kubeRootConfigMap.data?.["ca.crt"];
        if (!caCrt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "CA certificate not found in kube root config map",
          });
        }
        caCrtBase64 = globalThis.btoa(caCrt);
      }

      const userName = ctx.session.user?.data?.email || "oidc-user";

      const allowedNames = new Set(Object.values(krciConfigMapNames) as string[]);

      const krciConfigMap = configMaps.find((i) => allowedNames.has(i.metadata.name));

      const apiClusterEndpoint = krciConfigMap?.data?.api_cluster_endpoint;

      if (!apiClusterEndpoint) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API cluster endpoint not found in any KRCI config map",
        });
      }

      return {
        config: {
          apiVersion: "v1",
          kind: "Config",
          "current-context": clusterName,
          clusters: [
            {
              name: clusterName,
              cluster: {
                server: apiClusterEndpoint,
                "certificate-authority-data": caCrtBase64,
              },
            },
          ],
          users: [
            {
              name: userName,
              user: {
                token,
              },
            },
          ],
          contexts: [
            {
              name: clusterName,
              context: {
                cluster: clusterName,
                user: userName,
              },
            },
          ],
        },
        tokenExpiresAt,
      };
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
