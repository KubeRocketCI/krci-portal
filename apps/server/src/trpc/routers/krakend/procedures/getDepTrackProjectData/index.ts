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

export const getDepTrackProjectDataProcedure = protectedProcedure
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

    const depTrackQuickLink = (await caller.k8s.get({
      clusterName,
      namespace,
      resourceConfig: k8sQuickLinkConfig,
      name: systemQuickLink["dependency-track"],
    })) as QuickLink;

    const krakendClient = new KrakendClient({ apiBaseURL, idToken });
    const projectData = await krakendClient.getDepTrackProjectData(name);
    const projectID = krakendClient.getDepTrackProjectID(projectData);
    const metrics = await krakendClient.getDepTrackProjectMetrics(projectID);

    return {
      metrics,
      baseUrl: depTrackQuickLink.spec.url,
      projectID,
    };
  });
