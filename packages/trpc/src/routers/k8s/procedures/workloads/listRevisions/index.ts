import { z } from "zod";
import { DEPLOYMENT_REVISION_ANNOTATION } from "@my-project/shared";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { getDeploymentOwnedReplicaSets } from "../../../utils/getDeploymentOwnedReplicaSets/index.js";
import { isControlledBy } from "../../../utils/isControlledBy/index.js";
import type { DeploymentRevision } from "./types.js";

// UI display cap for the rollback dialog. Rollback itself is not bounded by this
// constant: the server fetches the owned-RS set via listAllResources (paginated up to
// the default maxPages=20 cap) and accepts any valid UID in that set, even one whose
// revision is older than the 10 we return here.
const MAX_REVISIONS = 10;

export const k8sListDeploymentRevisionsProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      name: z.string(),
    })
  )
  .query(async ({ input, ctx }): Promise<DeploymentRevision[]> => {
    try {
      const k8sClient = getInitializedK8sClient(ctx);

      const { namespace, name } = input;

      // Fetch the Deployment and the ReplicaSets it owns (narrowed by matchLabels to
      // avoid the namespace-wide scan + ~500-item page limit).
      const { deploymentUid, currentRevision, items } = await getDeploymentOwnedReplicaSets(k8sClient, name, namespace);

      // Match rollback's stricter predicate: only the controlling Deployment counts.
      const owned = items.filter((rs) => isControlledBy(rs.metadata.ownerReferences, "Deployment", deploymentUid));

      // When the Deployment's revision annotation is missing, fall back to treating
      // the RS with the highest revision number as the current one. This covers the
      // edge case where the Deployment was patched out-of-band and lost its annotation.
      const revisions = owned
        .map((rs): DeploymentRevision | null => {
          const revisionStr = rs.metadata.annotations?.[DEPLOYMENT_REVISION_ANNOTATION];
          if (!revisionStr) return null;
          const revision = Number(revisionStr);
          if (!Number.isFinite(revision)) return null;
          // Compare numerically to avoid false inequality from non-standard formatting
          // (e.g. '010' vs '10'). Both `revision` (already parsed) and `currentRevision`
          // are guarded: revision is Number.isFinite-checked above; currentRevision is
          // re-parsed here so non-numeric annotations cannot produce a false positive.
          const currentRevisionNum = Number(currentRevision);
          const isCurrentNumeric =
            currentRevision !== undefined && Number.isFinite(currentRevisionNum) && revision === currentRevisionNum;
          return {
            revision,
            replicaSetName: rs.metadata.name,
            replicaSetUid: rs.metadata.uid,
            creationTimestamp: rs.metadata.creationTimestamp,
            images: (rs.spec?.template?.spec?.containers ?? []).flatMap((c) => (c.image ? [c.image] : [])),
            isCurrent: isCurrentNumeric,
          };
        })
        .filter((r): r is DeploymentRevision => r !== null)
        .sort((a, b) => b.revision - a.revision);

      if (currentRevision === undefined && revisions.length > 0) {
        revisions[0].isCurrent = true;
      }

      // Always include the current revision in the returned slice, even if its
      // revision number falls outside the top MAX_REVISIONS (e.g. Deployment
      // rolled back to an old revision after many newer revisions accumulated).
      // Without this guard the dialog would show a window of recent history
      // with no indication that the workload is actually at a much older
      // revision, and the rollback UI would let the user select what the server
      // will reject as the current revision.
      const sliced = revisions.slice(0, MAX_REVISIONS);
      const currentInSlice = sliced.some((r) => r.isCurrent);
      if (!currentInSlice) {
        const currentRevisionEntry = revisions.find((r) => r.isCurrent);
        if (currentRevisionEntry) {
          // Drop the oldest entry from the slice to keep the size at MAX_REVISIONS
          // and append the current revision so it always renders in the dialog.
          sliced.pop();
          sliced.push(currentRevisionEntry);
        }
      }

      return sliced;
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
