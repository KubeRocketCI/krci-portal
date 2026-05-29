import { ApisApi } from "@kubernetes/client-node";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { z } from "zod";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

export const defaultK8sApiVersion = "v1";

export const k8sGetApiVersions = protectedProcedure.output(z.string()).query(async ({ ctx }) => {
  const k8sClient = getInitializedK8sClient(ctx);

  const apisApi = k8sClient.KubeConfig.makeApiClient(ApisApi);

  const apiGroupList = await apisApi.getAPIVersions();

  const groups = apiGroupList.groups || [];

  const authGroup = groups.find((g: any) => g.name === "authorization.k8s.io");

  return authGroup?.preferredVersion?.version || defaultK8sApiVersion;
});
