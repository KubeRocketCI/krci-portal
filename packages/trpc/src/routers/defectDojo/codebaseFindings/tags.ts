/**
 * Keys of the tags on the tests in DefectDojo. The CI security scan writes `codebase` and `tenant`, the security
 * operator `cluster`, `namespace`, `app`, `workload`, `container` and `reportKind`, and both write `ociImage`.
 */
export const TAG_KEY = {
  codebase: "app.edp.epam.com/codebase",
  tenant: "app.edp.epam.com/tenant",
  ociImage: "oci-image",
  cluster: "k8s-cluster",
  namespace: "k8s-namespace",
  app: "app",
  workload: "k8s-workload",
  container: "k8s-container",
  reportKind: "report-kind",
} as const;

export type TagKey = (typeof TAG_KEY)[keyof typeof TAG_KEY];

export function formatTag(key: TagKey, value: string): string {
  return `${key}:${value}`;
}

/** Value of the tag `<key>:<value>`, or `null` when the test has no tag of that key. */
export function tagValue(tags: readonly string[], key: TagKey): string | null {
  const prefix = `${key}:`;
  const tag = tags.find((candidate) => candidate.startsWith(prefix));
  return tag === undefined ? null : tag.slice(prefix.length);
}
