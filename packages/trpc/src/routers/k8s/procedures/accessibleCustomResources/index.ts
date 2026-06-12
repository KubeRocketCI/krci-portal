import {
  AuthorizationV1Api,
  type V1APIGroup,
  type V1APIGroupList,
  type V1APIResourceList,
} from "@kubernetes/client-node";
import { z } from "zod";
import { CR_WRITE_VERBS, type AccessibleCustomResource } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getInitializedK8sClient } from "../../utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../utils/handleK8sError/index.js";
import { mapRulesToCatalog, WILDCARD_RESOURCE } from "./mapRulesToCatalog.js";

/**
 * Intersect one group's RBAC plurals with its discovery documents. Preferred
 * version first: when a plural is served in several versions, the catalog
 * reports the preferred one. The remaining served versions are still scanned
 * because a type may be served ONLY there (e.g. a resource that never graduated
 * past v1beta1 while the group's preferred version moved to v1) — the RBAC
 * grant for it is real, and the admin CRD-watch path shows it.
 */
async function catalogGroup(
  k8sClient: ReturnType<typeof getInitializedK8sClient>,
  group: string,
  meta: V1APIGroup,
  plurals: Map<string, string[]>
): Promise<AccessibleCustomResource[]> {
  const versions = Array.from(
    new Set([meta.preferredVersion?.version, ...(meta.versions ?? []).map((v) => v.version)])
  ).filter((version): version is string => !!version);

  const docs = await Promise.all(
    versions.map(async (version) => {
      try {
        return { version, list: await k8sClient.fetchApiPath<V1APIResourceList>(`/apis/${group}/${version}`) };
      } catch {
        return null; // one version's discovery failed — skip it
      }
    })
  );

  const wildcardVerbs = plurals.get(WILDCARD_RESOURCE);
  const cataloged = new Set<string>();
  const entries: AccessibleCustomResource[] = [];
  for (const doc of docs) {
    if (!doc) continue;
    for (const served of doc.list.resources ?? []) {
      if (served.name.includes("/")) continue; // subresource
      if (cataloged.has(served.name)) continue; // already matched at a higher-priority version
      const explicitVerbs = plurals.get(served.name);
      // A type makes it into the catalog only when RBAC names it explicitly
      // or grants the whole group via resources:["*"]; plurals not served in
      // ANY of the group's versions are dropped (stale rules).
      if (!explicitVerbs && !wildcardVerbs) continue;
      cataloged.add(served.name);
      const verbs = Array.from(new Set([...(explicitVerbs ?? []), ...(wildcardVerbs ?? [])]));
      entries.push({
        group,
        version: doc.version,
        plural: served.name,
        kind: served.kind,
        // K8s convention: when discovery omits the singular (common for CRDs),
        // it defaults to the lowercase kind — same fallback buildCRDescriptor uses.
        singular: served.singularName || served.kind.toLowerCase(),
        namespaced: served.namespaced,
        verbs,
        editable: verbs.some((verb) => CR_WRITE_VERBS.has(verb)),
      });
    }
  }
  return entries;
}

/**
 * Permission-aware catalog of custom-resource TYPES for users who cannot list
 * CRDs cluster-wide: one SelfSubjectRulesReview for the namespace, intersected
 * with API discovery (/apis + /apis/<group>/<version> per served version of each
 * accessible group). Read-only; per-resource editing stays gated by
 * SelfSubjectAccessReview.
 */
export const k8sAccessibleCustomResourcesProcedure = protectedProcedure
  .input(
    z.object({
      // Cache-key disambiguation only — like every k8s procedure, the server acts
      // on the session's current cluster context.
      clusterName: z.string(),
      namespace: z.string(),
    })
  )
  .query(async ({ input, ctx }): Promise<AccessibleCustomResource[]> => {
    try {
      const { namespace } = input;
      const k8sClient = getInitializedK8sClient(ctx);
      const authApi = k8sClient.KubeConfig.makeApiClient(AuthorizationV1Api);

      // 1) One SelfSubjectRulesReview = the user's entire effective RBAC for this namespace.
      const review = await authApi.createSelfSubjectRulesReview({
        body: {
          apiVersion: "authorization.k8s.io/v1",
          kind: "SelfSubjectRulesReview",
          spec: { namespace },
        },
      });
      const status = review.status;
      // `incomplete: true` is expected on clusters with an external-authz webhook
      // (it cannot enumerate); the rules that ARE returned come straight from RBAC
      // and are trusted as-is. Never fail open to the full cluster catalog here.
      if (status?.evaluationError) {
        console.warn(`[accessibleCustomResources] SSRR evaluationError (ns=${namespace}): ${status.evaluationError}`);
      }

      const byGroup = mapRulesToCatalog(status?.resourceRules ?? []);
      if (byGroup.size === 0) return [];

      // 2) Discovery for ONLY the candidate groups (bounded): one /apis + one
      //    /apis/<group>/<version> per served version of each candidate group.
      const apiGroupList = await k8sClient.fetchApiPath<V1APIGroupList>("/apis");
      // fetchApiPath blind-casts the body, so a degraded /apis response without
      // `groups` must degrade to an empty catalog, not a 500.
      const groupMeta = new Map((apiGroupList.groups ?? []).map((group) => [group.name, group]));

      const result: AccessibleCustomResource[] = [];
      await Promise.all(
        Array.from(byGroup.entries()).map(async ([group, plurals]) => {
          const meta = groupMeta.get(group);
          if (!meta) return; // stale RBAC rule — group no longer served
          try {
            result.push(...(await catalogGroup(k8sClient, group, meta, plurals)));
          } catch (error) {
            // One broken group must not fail the whole request.
            console.warn(`[accessibleCustomResources] skipping group ${group} (ns=${namespace}): ${String(error)}`);
          }
        })
      );

      // Kind uniqueness within a group is conventional, not enforced — plural breaks ties.
      result.sort(
        (a, b) => a.group.localeCompare(b.group) || a.kind.localeCompare(b.kind) || a.plural.localeCompare(b.plural)
      );
      return result;
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
