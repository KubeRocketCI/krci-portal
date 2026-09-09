import { z } from "zod";
import { k8sResourceNameSchema } from "@my-project/shared";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";

// "" is the core group; any other group is a DNS subdomain.
const apiGroupSchema = z.union([z.literal(""), k8sResourceNameSchema]);
const apiVersionPattern = /^v[0-9]+((alpha|beta)[0-9]+)?$/;

/**
 * Report which resource types a cluster serves for one API group/version.
 *
 * Returns `served` with the plural list, or `not-served` when the group/version
 * is absent — the normal state for an optional add-on. Every other failure
 * throws; callers treat a thrown result as unknown and fall back to fetching.
 */
export const k8sDiscoveryDocumentProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: apiGroupSchema,
      version: z.string().max(63).regex(apiVersionPattern),
    })
  )
  .query(async ({ input, ctx }) => {
    const { group, version } = input;

    try {
      const document = await new K8sClient(ctx.session).fetchDiscoveryDocument(group, version);

      if (document.status === "absent") {
        return { status: "not-served" as const, plurals: [] as string[] };
      }

      return {
        status: "served" as const,
        plurals: document.resources.map((resource) => resource.name),
      };
    } catch (error) {
      rethrowOrHandleK8sError(error);
    }
  });
