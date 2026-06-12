/**
 * Builds a stable, cluster-agnostic pin key for a sidebar page.
 *
 * Format:
 *   - No identifying params (or only `clusterName`): `page:<path>`
 *   - With identifying params:                        `page:<path>?<k1>=<v1>&<k2>=<v2>`
 *
 * `clusterName` is always excluded so that pins are cluster-agnostic (a page
 * pinned on cluster "dev" stays pinned when the user switches to "prod").
 * Remaining params are sorted by key name to ensure deterministic output
 * regardless of object insertion order. Keys and values are percent-encoded
 * so distinct param sets can never serialize to the same key (e.g. a value
 * containing `&` or `=`). Current K8s params are DNS-constrained, so encoding
 * is an identity transform for every key that exists today.
 *
 * Examples:
 *   buildPinKey("/c/$clusterName/cicd/pipelines", { clusterName: "dev" })
 *   → "page:/c/$clusterName/cicd/pipelines"
 *
 *   buildPinKey("/c/$clusterName/k8s/$kind", { clusterName: "dev", kind: "deployments" })
 *   → "page:/c/$clusterName/k8s/$kind?kind=deployments"
 *
 *   buildPinKey("/c/$clusterName/k8s/cr/$group/$version/$plural", { clusterName: "dev", group: "apps", plural: "mycrds", version: "v1" })
 *   → "page:/c/$clusterName/k8s/cr/$group/$version/$plural?group=apps&plural=mycrds&version=v1"
 */
export function buildPinKey(path: string, params: Record<string, string> = {}): string {
  const identifying = Object.entries(params)
    .filter(([key]) => key !== "clusterName")
    .sort(([a], [b]) => a.localeCompare(b));

  if (identifying.length === 0) {
    return `page:${path}`;
  }

  const query = identifying.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `page:${path}?${query}`;
}
