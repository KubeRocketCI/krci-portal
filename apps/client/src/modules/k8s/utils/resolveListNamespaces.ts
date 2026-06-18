/**
 * Which namespaces a K8s-mode list page fetches from: a `?namespace=` deep-link
 * wins, else the filter selection, else `undefined` — which lets
 * `useWatchListMultiple` fall back to the store's allowed namespaces (keeping that
 * fallback in one place instead of resolving it here).
 */
export function resolveListNamespaces({
  urlNamespace,
  filterNamespaces,
}: {
  urlNamespace?: string;
  filterNamespaces?: string[];
}): string[] | undefined {
  if (urlNamespace) {
    return [urlNamespace];
  }

  if (filterNamespaces && filterNamespaces.length > 0) {
    return filterNamespaces;
  }

  return undefined;
}
