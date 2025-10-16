import { KrakendClient } from "@/clients/krakend";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { createCaller } from "@/trpc/routers";
import { TRPCError } from "@trpc/server";
import {
  k8sConfigMapConfig,
  ConfigMap,
  krciConfigMapNames,
  GitLabPipelineVariable,
} from "@my-project/shared";
import { z } from "zod";

const gitLabPipelineVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const triggerGitLabPipelineProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      project: z.string(),
      ref: z.string(),
      variables: z.array(gitLabPipelineVariableSchema).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { clusterName, namespace, gitServer, project, ref, variables } =
      input;
    const { session } = ctx;

    console.log("triggerGitLabPipeline - Input:", {
      clusterName,
      namespace,
      gitServer,
      project,
      ref,
      variables,
    });

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

    console.log("API Base URL from ConfigMap:", apiBaseURL);

    if (!apiBaseURL) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "api_gateway_url not found in ConfigMap",
      });
    }

    const krakendClient = new KrakendClient({ apiBaseURL, idToken });

    try {
      const result = await krakendClient.triggerGitLabPipeline(
        gitServer,
        project,
        ref,
        variables as GitLabPipelineVariable[]
      );
      console.log("GitLab Pipeline triggered successfully:", result);
      return result;
    } catch (error) {
      console.error("Error triggering GitLab Pipeline:", error);
      throw error;
    }
  });
