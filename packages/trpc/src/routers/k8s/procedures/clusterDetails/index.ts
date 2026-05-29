import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { VersionApi } from "@kubernetes/client-node";
import { getInitializedK8sClient } from "../../utils/getInitializedK8sClient/index.js";

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
    const k8sClient = getInitializedK8sClient(ctx);

    const currentCluster = k8sClient.KubeConfig.getCurrentCluster();
    const currentContext = k8sClient.KubeConfig.getCurrentContext();

    if (!currentCluster) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No current cluster found in KubeConfig",
      });
    }

    // Use actual cluster name from kubeconfig first, fallback to env var
    // This ensures the cluster name matches the actual K8s cluster being accessed
    const clusterName = currentCluster.name || process.env.DEFAULT_CLUSTER_NAME || currentContext || "unknown";
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
