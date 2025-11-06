import { ApisApi } from "@kubernetes/client-node";
import { protectedProcedure } from "../../../../../procedures/protected";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { K8sClient } from "../../../../../clients/k8s";

export const defaultK8sApiVersion = "v1";

export const k8sGetApiVersions = protectedProcedure.output(z.string()).query(async ({ ctx }) => {
  const k8sClient = new K8sClient(ctx.session);

  if (!k8sClient.KubeConfig) {
    throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
  }

  const apisApi = k8sClient.KubeConfig.makeApiClient(ApisApi);

  const apiGroupList = await apisApi.getAPIVersions();

  const groups = apiGroupList.groups || [];

  const authGroup = groups.find((g: any) => g.name === "authorization.k8s.io");

  return authGroup?.preferredVersion?.version || defaultK8sApiVersion;
});
