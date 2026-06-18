import { useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { useClusterStore } from "@/k8s/store";
import type { SelectOption } from "@/core/components/form";

/**
 * Options/visibility for the K8s-mode "Namespaces" filter. Shown only when more
 * than one namespace is allowed, and hidden when a `?namespace=` deep-link pins
 * the view to one namespace — the fetch ignores the filter selection in that mode
 * (see `resolveListNamespaces`), so showing it could only empty the table.
 */
export function useNamespaceFilterOptions() {
  const allowedNamespaces = useClusterStore(useShallow((s) => s.allowedNamespaces));
  const { namespace: urlNamespace } = useSearch({ strict: false }) as { namespace?: string };

  const namespaceOptions = useMemo<SelectOption[]>(
    () => allowedNamespaces.map((value) => ({ label: value, value })),
    [allowedNamespaces]
  );

  return {
    allowedNamespaces,
    namespaceOptions,
    showNamespaceFilter: allowedNamespaces.length > 1 && !urlNamespace,
  };
}
