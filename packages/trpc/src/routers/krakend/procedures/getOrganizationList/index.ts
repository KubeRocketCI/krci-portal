import { KrakendClient } from "../../../../clients/krakend/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { k8sConfigMapConfig, ConfigMap, krciConfigMapNames } from "@my-project/shared";
import { z } from "zod";
import { K8sClient } from "../../../../clients/k8s/index.js";

export const getOrganizationListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace, gitServer } = input;
    const { session } = ctx;
    const k8sClient = new K8sClient(session);

    const idToken = session.user!.secret.idToken;

    const configMapList = await k8sClient.listResource(k8sConfigMapConfig, namespace);

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
    return await krakendClient.getGitFusionOrganizations(gitServer);
  });
