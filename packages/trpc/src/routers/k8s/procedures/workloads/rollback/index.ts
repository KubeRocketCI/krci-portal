import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { DEPLOYMENT_REVISION_ANNOTATION, k8sDeploymentConfig } from "@my-project/shared";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { getDeploymentOwnedReplicaSets } from "../../../utils/getDeploymentOwnedReplicaSets/index.js";
import { isControlledBy } from "../../../utils/isControlledBy/index.js";

export const k8sRollbackDeploymentProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      name: z.string(),
      replicaSetUid: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const k8sClient = getInitializedK8sClient(ctx);

      const { namespace, name, replicaSetUid } = input;

      // Fetch the Deployment and the ReplicaSets it owns (narrowed by matchLabels,
      // following the continue token so a long revision history is not truncated).
      const { deploymentUid, currentRevision, items, listContinue } = await getDeploymentOwnedReplicaSets(
        k8sClient,
        name,
        namespace
      );

      // Match the RS by uid AND require the Deployment to be its controlling owner.
      const target = items.find(
        (rs) =>
          rs.metadata.uid === replicaSetUid && isControlledBy(rs.metadata.ownerReferences, "Deployment", deploymentUid)
      );

      if (!target || !target.spec?.template) {
        // listAllResources caps pagination at maxPages (currently 20 × ~500 items).
        // When the cap was hit, the continue token is non-empty —
        // surface that to operators rather than mislead them with NOT_FOUND.
        if (listContinue) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Deployment has more revision history than this UI can scan. Run `kubectl rollout undo` directly, or delete old ReplicaSets first.",
          });
        }
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target revision no longer exists or is not owned by this deployment",
        });
      }

      // Reject rollback to the active revision: PATCHing the Deployment with its own
      // template wastes an API call, churns the controller, and gives no UX signal.
      // The UI marks the current RS as isCurrent, so this guard only catches stale
      // requests (cache replay, two open tabs racing).
      //
      // All revision comparisons use Number() to normalise annotation values like '010'
      // and '10' to the same integer (10), mirroring the numeric comparison in
      // listRevisions so both paths agree on which RS is current.
      //
      // Primary check: compare revision annotations when both are present.
      // Fallback A: when currentRevision is known but targetRevision is absent, compare by UID.
      // Fallback B: when currentRevision is absent from the Deployment (annotation stripped
      //   out-of-band), identify the controller-owned RS with the highest revision number
      //   as the de-facto active RS and block rollback to it, mirroring the same heuristic
      //   used by listRevisions to flag isCurrent.

      // Parse currentRevision once; NaN when undefined/non-numeric so isFinite guards below fail safely.
      const currentRevisionNum = currentRevision !== undefined ? Number(currentRevision) : NaN;

      const targetRevision = target.metadata.annotations?.[DEPLOYMENT_REVISION_ANNOTATION];
      const targetRevisionNum = targetRevision !== undefined ? Number(targetRevision) : NaN;
      const isCurrentByRevision =
        Number.isFinite(targetRevisionNum) &&
        Number.isFinite(currentRevisionNum) &&
        targetRevisionNum === currentRevisionNum;

      // Fallback A: when targetRevision annotation is missing but currentRevision is known,
      // check by UID whether the target RS is the same object as the currently-active RS.
      // Only do this when currentRevision is defined — otherwise the annotation lookup
      // `annotation === undefined` would match every annotation-less RS.
      const activeRsByUid = Number.isFinite(currentRevisionNum)
        ? items.find(
            (rs) =>
              Number(rs.metadata.annotations?.[DEPLOYMENT_REVISION_ANNOTATION]) === currentRevisionNum &&
              isControlledBy(rs.metadata.ownerReferences, "Deployment", deploymentUid)
          )
        : undefined;
      const isCurrentByUid = activeRsByUid !== undefined && activeRsByUid.metadata.uid === replicaSetUid;

      // Fallback B: when the Deployment has no revision annotation, use the RS with the
      // highest numeric revision among controller-owned RSes as the active one.
      let isCurrentByHighestRevision = false;
      if (currentRevision === undefined) {
        const ownedWithRevisions = items
          .filter((rs) => isControlledBy(rs.metadata.ownerReferences, "Deployment", deploymentUid))
          .map((rs) => ({
            uid: rs.metadata.uid,
            revision: Number(rs.metadata.annotations?.[DEPLOYMENT_REVISION_ANNOTATION] ?? NaN),
          }))
          .filter((r) => Number.isFinite(r.revision));
        if (ownedWithRevisions.length > 0) {
          const maxRevision = Math.max(...ownedWithRevisions.map((r) => r.revision));
          const highestRevisionRS = ownedWithRevisions.find((r) => r.revision === maxRevision);
          isCurrentByHighestRevision = highestRevisionRS?.uid === replicaSetUid;
        }
      }

      if (isCurrentByRevision || isCurrentByUid || isCurrentByHighestRevision) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target revision is already the current revision of this Deployment",
        });
      }

      const template = structuredClone(target.spec.template) as {
        metadata?: { labels?: Record<string, string> };
      };
      if (template.metadata?.labels) {
        delete template.metadata.labels["pod-template-hash"];
      }

      return await k8sClient.patchResource(k8sDeploymentConfig, name, namespace, { spec: { template } }, "strategic");
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
