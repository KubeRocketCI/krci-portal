import { BUILTIN_API_GROUPS } from "@my-project/shared";
import type { V1ResourceRule } from "@kubernetes/client-node";

/**
 * Sentinel plural key for a per-group `resources: ["*"]` grant. "*" is not a legal
 * resource name, so it can never collide with a real plural. The procedure expands
 * it against the group's discovery documents (the per-version calls it already makes).
 */
export const WILDCARD_RESOURCE = "*";

/**
 * Collapse SelfSubjectRulesReview resourceRules into group → plural → verbs[],
 * applying the catalog filters:
 *  - drop the core group ("") and built-in/aggregated groups (BUILTIN_API_GROUPS)
 *  - drop wildcard apiGroups ("*") — expanding them needs discovery across every
 *    group on the cluster. Users with apiGroups:["*"] AND resources:["*"] can list
 *    CRDs cluster-wide and take the CRD-watch path anyway. Known false negative:
 *    a grant of apiGroups:["*"] with specific resource names (rare, but legal
 *    RBAC) cannot list CRDs, and those types won't appear in the catalog unless
 *    another rule names their group explicitly
 *  - keep a per-group resources wildcard under the WILDCARD_RESOURCE sentinel key —
 *    unlike a cluster-wide wildcard it expands with the per-version discovery calls
 *    catalogGroup already makes for the group
 *  - drop subresources (resource name contains "/", e.g. "pods/log")
 *  - drop instance-scoped grants (rule.resourceNames non-empty) — listing the type
 *    would 403 for everything but those named objects, misleading in a list view
 */
export function mapRulesToCatalog(rules: V1ResourceRule[]): Map<string, Map<string, string[]>> {
  const byGroup = new Map<string, Map<string, Set<string>>>();
  for (const rule of rules) {
    if (rule.resourceNames && rule.resourceNames.length > 0) continue;
    const apiGroups = rule.apiGroups ?? [];
    const resources = rule.resources ?? [];
    const verbs = rule.verbs ?? [];
    for (const group of apiGroups) {
      if (group === "*" || BUILTIN_API_GROUPS.has(group)) continue;
      for (const resource of resources) {
        if (resource !== WILDCARD_RESOURCE && resource.includes("/")) continue;
        const plurals = byGroup.get(group) ?? new Map<string, Set<string>>();
        const set = plurals.get(resource) ?? new Set<string>();
        verbs.forEach((v) => set.add(v));
        plurals.set(resource, set);
        byGroup.set(group, plurals);
      }
    }
  }
  // Freeze Sets → string[] for a stable return type.
  const out = new Map<string, Map<string, string[]>>();
  for (const [group, plurals] of byGroup) {
    const m = new Map<string, string[]>();
    for (const [plural, set] of plurals) m.set(plural, Array.from(set));
    out.set(group, m);
  }
  return out;
}
