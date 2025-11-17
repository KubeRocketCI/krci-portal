import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { k8sConfigMapConfig, ConfigMap, krciConfigMapNames } from "@my-project/shared";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors/index.js";
import z from "zod";
import { K8sClient } from "../../../../clients/k8s/index.js";

export const kubeRootConfigName = "kube-root-ca.crt";

export const k8sGetKubeConfig = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace } = input;
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const currentCluster = k8sClient.KubeConfig.getCurrentCluster();
    const currentUser = k8sClient.KubeConfig.getCurrentUser();

    if (!currentCluster || !currentUser) {
      throw new Error("Invalid KubeConfig: missing cluster or user info");
    }

    const token = currentUser.token || ctx.session.user?.secret?.accessToken;
    const tokenExpiresAt = ctx.session.user?.secret?.accessTokenExpiresAt;

    if (!token) {
      throw new Error("No token found for user");
    }

    const { name: clusterName, caData } = currentCluster;

    // List config maps directly using K8sClient
    const configMapList = await k8sClient.listResource(k8sConfigMapConfig, namespace);

    const configMaps = (configMapList.items || []) as ConfigMap[];

    let caCrtBase64: string;
    if (caData && typeof caData === "string") {
      caCrtBase64 = caData.startsWith("-----") ? globalThis.btoa(caData) : caData;
    } else {
      const kubeRootConfigMap = configMaps.find((i) => i.metadata.name === kubeRootConfigName);

      if (!kubeRootConfigMap) {
        throw new Error("Kube root config map not found");
      }

      const caCrt = kubeRootConfigMap.data?.["ca.crt"];
      if (!caCrt) {
        throw new Error("CA certificate not found in kube root config map");
      }
      caCrtBase64 = globalThis.btoa(caCrt); // base64 encode the cert
    }

    const userName = ctx.session.user?.data?.email || "oidc-user";

    const allowedNames = new Set(Object.values(krciConfigMapNames) as string[]);

    const krciConfigMap = configMaps.find((i) => allowedNames.has(i.metadata.name));

    const apiClusterEndpoint = krciConfigMap?.data?.api_cluster_endpoint;

    if (!apiClusterEndpoint) {
      throw new Error("API cluster endpoint not found in config map");
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
  });
