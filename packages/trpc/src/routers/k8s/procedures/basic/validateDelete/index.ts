import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { k8sResourceConfigSchema, K8sApiError } from "@my-project/shared";
import { K8sClient } from "../../../../../clients/k8s/index.js";

// The API server prefixes a denial with the name of the webhook that produced it,
// which is noise to the user.
const ADMISSION_PREFIX = /^admission webhook "[^"]*" denied the request:\s*/;

const DENIAL_STATUS_CODES = new Set([403, 422]);

function extractReason(responseBody: string, fallback: string): string {
  try {
    const parsed = JSON.parse(responseBody) as { message?: string };
    const message = parsed.message?.trim();

    if (message) {
      return message.replace(ADMISSION_PREFIX, "");
    }
  } catch {
    // Not a JSON Status body.
  }

  return fallback;
}

/**
 * Asks the API server whether deleting a resource would be admitted, without deleting it, and
 * returns the verdict with the refusal message. The rules are enforced by the operators'
 * validating webhooks — e.g. a CodebaseBranch cannot be deleted while a CDPipeline references it.
 */
export const k8sValidateDeleteProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema,
    })
  )
  .mutation(async ({ input, ctx }): Promise<{ allowed: boolean; reason?: string }> => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { name, namespace, resourceConfig } = input;

    try {
      await k8sClient.deleteResource(resourceConfig, name, namespace, { dryRun: true });

      return { allowed: true };
    } catch (error) {
      // Admission refuses with Forbidden (403) or Invalid (422). Anything else — webhook
      // unreachable under failurePolicy=fail, network trouble — falls through to allowed:
      // the real delete revalidates through the same admission chain.
      if (error instanceof K8sApiError && DENIAL_STATUS_CODES.has(error.statusCode)) {
        return {
          allowed: false,
          reason: extractReason(error.responseBody, error.statusText || "Deletion is not allowed."),
        };
      }

      return { allowed: true };
    }
  });
