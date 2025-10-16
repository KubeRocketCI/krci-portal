import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { createCaller } from "@/trpc/routers";
import { k8sConfigMapConfig, ConfigMap } from "@my-project/shared";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";

export const kubeRootConfigName = "kube-root-ca.crt";

export const k8sGetKubeConfig = protectedProcedure.query(async ({ ctx }) => {
  const { K8sClient } = ctx;

  if (!K8sClient.KubeConfig) {
    throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
  }

  // Extract current cluster and user from the kubeconfig
  const currentCluster = K8sClient.KubeConfig.getCurrentCluster();
  const currentUser = K8sClient.KubeConfig.getCurrentUser();

  if (!currentCluster || !currentUser) {
    throw new Error("Invalid KubeConfig: missing cluster or user info");
  }

  // Extract cluster details
  const { name: clusterName, server, caData } = currentCluster;

  // Determine the CA certificate data
  let caCrtBase64: string;
  if (caData && typeof caData === "string") {
    caCrtBase64 = caData.startsWith("-----") ? globalThis.btoa(caData) : caData; // already base64
  } else {
    const caller = createCaller(ctx);

    const kubeRootConfigMap = (await caller.k8s.get({
      clusterName,
      namespace: "kube-system",
      resourceConfig: k8sConfigMapConfig,
      name: kubeRootConfigName,
    })) as ConfigMap;

    const caCrt = kubeRootConfigMap.data?.["ca.crt"];
    if (!caCrt) {
      throw new Error("CA certificate not found in config map");
    }
    caCrtBase64 = globalThis.btoa(caCrt); // base64 encode the cert
  }

  // Get token from current user or session data
  const token = currentUser.token || ctx.session.user?.secret?.accessToken;
  if (!token) {
    throw new Error("No token found for user");
  }

  // Get user name from session or default to 'oidc-user'
  const userName = ctx.session.user?.data?.email || "oidc-user";

  // Return the formatted kubeconfig object
  return {
    apiVersion: "v1",
    kind: "Config",
    "current-context": clusterName,
    clusters: [
      {
        name: clusterName,
        cluster: {
          server,
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
  };
});
