import * as k8s from "@kubernetes/client-node";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";

export const defaultK8sApiVersion = "v1";

export const k8sGetApiVersions = protectedProcedure
  .output(z.string())
  .query(async ({ ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const apisApi = K8sClient.KubeConfig.makeApiClient(k8s.ApisApi);

    const apiGroupList = await apisApi.getAPIVersions();

    const groups = apiGroupList.groups || [];

    const authGroup = groups.find((g) => g.name === "authorization.k8s.io");

    return authGroup?.preferredVersion?.version || defaultK8sApiVersion;
  });
