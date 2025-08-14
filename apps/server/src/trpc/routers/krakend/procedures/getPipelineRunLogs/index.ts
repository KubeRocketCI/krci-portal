import { KrakendClient } from "@/clients/krakend";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ConfigMap, krciConfigMapNames } from "@my-project/shared";
import { createCaller } from "@/trpc/routers";
import { k8sConfigMapConfig } from "@my-project/shared";

export const getPipelineRunLogsProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      name: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { clusterName, namespace, name } = input;
    const { session } = ctx;

    const idToken = session.user!.secret.idToken;

    const caller = createCaller(ctx);

    const listRes = await caller.k8s.list({
      clusterName,
      namespace,
      resourceConfig: k8sConfigMapConfig,
    });
    const configMaps = (listRes.items || []) as ConfigMap[];

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
    return await krakendClient.getPipelineRunLogs(namespace, name);
  });

export const getAllPipelineRunsLogsProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { clusterName, namespace } = input;
    const { session } = ctx;

    const idToken = session.user!.secret.idToken;

    const caller = createCaller(ctx);

    const listRes = await caller.k8s.list({
      clusterName,
      namespace,
      resourceConfig: k8sConfigMapConfig,
    });
    const configMaps = (listRes.items || []) as ConfigMap[];

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
    return await krakendClient.getAllPipelineRunsLogs(namespace);
  });
