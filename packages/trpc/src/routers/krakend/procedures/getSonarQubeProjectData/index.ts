import { KrakendClient } from "../../../../clients/krakend/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
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
import { K8sClient } from "../../../../clients/k8s/index.js";

export const getSonarQubeProjectDataProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      name: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace, name } = input;
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

    const sonarQuickLink = (await k8sClient.getResource(
      k8sQuickLinkConfig,
      systemQuickLink.sonar,
      namespace
    )) as QuickLink;

    const krakendClient = new KrakendClient({ apiBaseURL, idToken });
    const metrics = await krakendClient.getSonarQubeMetrics(name);
    const normalizedMetrics = krakendClient.parseSonarQubeMetrics(metrics);

    return {
      metrics: normalizedMetrics,
      baseUrl: sonarQuickLink.spec.url,
    };
  });
