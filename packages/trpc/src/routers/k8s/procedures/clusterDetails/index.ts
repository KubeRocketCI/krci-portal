import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors/index.js";
import { VersionApi } from "@kubernetes/client-node";

export const k8sGetClusterDetails = protectedProcedure
  .output(
    z.object({
      clusterName: z.string(),
      apiServerUrl: z.string(),
      defaultNamespace: z.string(),
      gitVersion: z.string().optional(),
      platform: z.string().optional(),
      goVersion: z.string().optional(),
    })
  )
  .query(async ({ ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const currentCluster = k8sClient.KubeConfig.getCurrentCluster();
    const currentContext = k8sClient.KubeConfig.getCurrentContext();

    if (!currentCluster) {
      throw new Error("No current cluster found");
    }

    const clusterName = process.env.DEFAULT_CLUSTER_NAME || currentCluster.name || currentContext || "unknown";
    const defaultNamespace = process.env.DEFAULT_CLUSTER_NAMESPACE || "default";
    const apiServerUrl = currentCluster.server || "unknown";

    // Get Kubernetes version information
    let gitVersion: string | undefined;
    let platform: string | undefined;
    let goVersion: string | undefined;

    try {
      const versionApi = k8sClient.KubeConfig.makeApiClient(VersionApi);
      const versionInfo = await versionApi.getCode();
      if (versionInfo) {
        gitVersion = versionInfo.gitVersion;
        platform = versionInfo.platform;
        goVersion = versionInfo.goVersion;
      }
    } catch (error) {
      // Version API might not be accessible, continue without version info
      console.warn("Failed to fetch Kubernetes version:", error);
    }

    return {
      clusterName,
      apiServerUrl,
      defaultNamespace,
      gitVersion,
      platform,
      goVersion,
    };
  });
