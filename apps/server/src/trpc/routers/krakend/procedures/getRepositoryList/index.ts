import { KrakendClient } from "@/clients/krakend";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { createCaller } from "@/trpc/routers";
import { TRPCError } from "@trpc/server";
import {
  k8sConfigMapConfig,
  ConfigMap,
  krciConfigMapNames,
} from "@my-project/shared";
import { z } from "zod";

export const getRepositoryListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      owner: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { clusterName, namespace, gitServer, owner } = input;
    const { session } = ctx;

    const idToken = session.user!.secret.idToken;

    const caller = createCaller(ctx);

    const configMapList = await caller.k8s.list({
      clusterName,
      namespace,
      resourceConfig: k8sConfigMapConfig,
    });

    const configMaps = (configMapList.items || []) as ConfigMap[];

    const allowedNames = new Set(Object.values(krciConfigMapNames) as string[]);
    const krciConfigMap = configMaps.find((i) =>
      allowedNames.has(i.metadata.name)
    );

    const apiBaseURL = krciConfigMap?.data?.api_gateway_url as
      | string
      | undefined;

    if (!apiBaseURL) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "api_gateway_url not found in ConfigMap",
      });
    }

    const krakendClient = new KrakendClient({ apiBaseURL, idToken });
    return await krakendClient.getGitFusionRepositories(gitServer, owner);
  });
