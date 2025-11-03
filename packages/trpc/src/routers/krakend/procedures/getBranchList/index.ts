import { KrakendClient } from "../../../../clients/krakend";
import { protectedProcedure } from "../../../../procedures/protected";
import { TRPCError } from "@trpc/server";
import { k8sConfigMapConfig, ConfigMap, krciConfigMapNames } from "@my-project/shared";
import { z } from "zod";

export const getBranchListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      owner: z.string(),
      repoName: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace, gitServer, owner, repoName } = input;
    const { session, K8sClient } = ctx;

    const idToken = session.user!.secret.idToken;

    const configMapList = await K8sClient.listResource(k8sConfigMapConfig, namespace);

    const configMaps = (configMapList.items || []) as ConfigMap[];

    const allowedNames = new Set(Object.values(krciConfigMapNames) as string[]);
    const krciConfigMap = configMaps.find((i) => allowedNames.has(i.metadata.name));

    const apiBaseURL = krciConfigMap?.data?.api_gateway_url as string | undefined;

    if (!apiBaseURL) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "api_gateway_url not found in ConfigMap",
      });
    }

    const krakendClient = new KrakendClient({ apiBaseURL, idToken });
    return await krakendClient.getGitFusionBranches(gitServer, owner, repoName);
  });
