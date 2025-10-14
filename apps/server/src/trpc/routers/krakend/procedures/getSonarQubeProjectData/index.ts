import { KrakendClient } from "@/clients/krakend";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { createCaller } from "@/trpc/routers";
import { TRPCError } from "@trpc/server";
import {
  k8sConfigMapConfig,
  ConfigMap,
  krciConfigMapNames,
  systemQuickLink,
  k8sQuickLinkConfig,
  QuickLink,
} from "@my-project/shared";
import { z } from "zod";

export const getSonarQubeProjectDataProcedure = protectedProcedure
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

    const sonarQuickLink = (await caller.k8s.get({
      clusterName,
      namespace,
      resourceConfig: k8sQuickLinkConfig,
      name: systemQuickLink.sonar,
    })) as QuickLink;

    const krakendClient = new KrakendClient({ apiBaseURL, idToken });
    const metrics = await krakendClient.getSonarQubeMetrics(name);
    const normalizedMetrics = krakendClient.parseSonarQubeMetrics(metrics);

    return {
      metrics: normalizedMetrics,
      baseUrl: sonarQuickLink.spec.url,
    };
  });
