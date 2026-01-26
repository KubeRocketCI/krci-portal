/**
 * Validates and returns a namespace from URL search params.
 * If the namespace is not in the allowed list, falls back to the default.
 *
 * @param searchNamespace - Namespace from URL search params
 * @param discoveredNamespaces - List of allowed namespaces
 * @param defaultNamespace - Fallback namespace
 * @returns The validated namespace or the default
 */
export function getValidNamespace(
  searchNamespace: string | undefined,
  discoveredNamespaces: string[],
  defaultNamespace: string
): string {
  return searchNamespace && discoveredNamespaces.includes(searchNamespace) ? searchNamespace : defaultNamespace;
}
