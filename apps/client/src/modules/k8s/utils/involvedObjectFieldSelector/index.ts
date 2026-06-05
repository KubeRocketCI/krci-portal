interface InvolvedObjectInput {
  kind?: string;
  metadata?: {
    uid?: string;
    name?: string;
    namespace?: string;
  };
}

/**
 * Builds a Kubernetes core/v1 Events `fieldSelector` that scopes a LIST to a
 * single resource. Prefers `involvedObject.uid` (exact); falls back to
 * kind+name+namespace. Returns `undefined` when the object carries nothing
 * identifying; callers (see `useResourceEvents`) then disable the fetch rather
 * than pulling — and mislabeling — the whole namespace's events.
 */
export function involvedObjectFieldSelector(item: InvolvedObjectInput): string | undefined {
  const uid = item.metadata?.uid;
  if (uid) {
    return `involvedObject.uid=${uid}`;
  }

  const name = item.metadata?.name;
  if (!name) {
    return undefined;
  }

  const parts: string[] = [];
  if (item.kind) {
    parts.push(`involvedObject.kind=${item.kind}`);
  }
  parts.push(`involvedObject.name=${name}`);
  if (item.metadata?.namespace) {
    parts.push(`involvedObject.namespace=${item.metadata.namespace}`);
  }
  return parts.join(",");
}
