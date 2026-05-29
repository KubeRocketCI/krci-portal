/**
 * Predicate that returns true iff `ownerRefs` contains an ownerReference with
 * controller:true matching the given kind and uid. Per the Kubernetes
 * ownerReferences spec at most one entry has controller:true, and rollback /
 * listRevisions both need to ensure the RS they touch is unambiguously owned
 * by the Deployment under inspection (not by an unrelated RS that happens to
 * share labels).
 */
export function isControlledBy(
  ownerRefs: ReadonlyArray<{ kind?: string; uid?: string; controller?: boolean }> | undefined,
  kind: string,
  uid: string
): boolean {
  return ownerRefs?.some((o) => o.controller === true && o.kind === kind && o.uid === uid) ?? false;
}
