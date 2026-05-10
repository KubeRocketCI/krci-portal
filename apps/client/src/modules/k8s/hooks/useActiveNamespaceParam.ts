import { useSearch } from "@tanstack/react-router";
import { useClusterStore } from "@/k8s/store";

export function useActiveNamespaceParam(): string {
  const search = useSearch({ strict: false }) as { namespace?: string };
  const stored = useClusterStore((s) => s.defaultNamespace);
  return search.namespace ?? stored ?? "";
}
