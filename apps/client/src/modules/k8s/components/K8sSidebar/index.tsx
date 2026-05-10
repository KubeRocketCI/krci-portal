import { useMatches, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/core/components/ui/sidebar";
import { SidebarMenuItemWithHover } from "@/core/components/sidebar/SidebarMenuItemWithHover";
import { useSidebarMenu } from "@/core/hooks/useSidebarMenu";
import { usePermissions } from "@/k8s/api/hooks/usePermissions";
import { resourceRegistry } from "../../registry";
import { createK8sNavigationConfig } from "../../constants/nav";

/**
 * Invisible component that checks create/update/delete permissions for a single
 * K8s resource kind and reports the result back to the parent via `onResult`.
 *
 * Keeping the hook call at the top level of this component satisfies React's
 * Rules of Hooks — the parent renders one instance per registry entry.
 */
function KindPermissionChecker({
  resourceKey,
  group,
  version,
  resourcePlural,
  onResult,
}: {
  resourceKey: string;
  group: string;
  version: string;
  resourcePlural: string;
  onResult: (key: string, allowed: boolean) => void;
}) {
  const perms = usePermissions({ group, version, resourcePlural });

  useEffect(() => {
    const data = perms.data;
    // While loading, treat as allowed so the sidebar populates immediately.
    // The watchList call will surface a 403 if the user lacks list/get rights.
    const anyAllowed = Boolean(data?.create?.allowed || data?.update?.allowed || data?.delete?.allowed);
    const allowed = perms.isLoading || anyAllowed || !perms.isError;
    onResult(resourceKey, allowed);
  }, [resourceKey, perms.data, perms.isLoading, perms.isError, onResult]);

  return null;
}

export function K8sSidebar({ isMinimized }: { isMinimized: boolean }) {
  const { clusterName } = useParams({ strict: false }) as { clusterName?: string };
  const matches = useMatches();

  // resourceRegistry is `as const`-frozen so entries are stable across renders.
  const entries = useMemo(() => Object.entries(resourceRegistry), []);

  // Accumulate per-kind permission results from child checkers.
  // Initial state: all kinds are pre-allowed so the sidebar renders immediately.
  const [permMap, setPermMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(entries.map(([key]) => [key, true]))
  );

  const onResult = useMemo(
    () => (key: string, allowed: boolean) => {
      setPermMap((prev) => {
        if (prev[key] === allowed) return prev; // avoid unnecessary re-renders
        return { ...prev, [key]: allowed };
      });
    },
    []
  );

  const allowedKinds = useMemo(
    () =>
      new Set(
        Object.entries(permMap)
          .filter(([, allowed]) => allowed)
          .map(([key]) => key)
      ),
    [permMap]
  );

  const nav = useMemo(
    () => (clusterName ? createK8sNavigationConfig(clusterName, allowedKinds) : []),
    [clusterName, allowedKinds]
  );
  const { isMenuOpen, toggleMenu, openMenu, closeMenusExcept } = useSidebarMenu(nav, matches);

  if (!clusterName) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Kubernetes</SidebarGroupLabel>
      {/* Render one invisible checker per registry kind (null renders, hooks at component top-level). */}
      {entries.map(([key, descriptor]) => (
        <KindPermissionChecker
          key={key}
          resourceKey={key}
          group={descriptor.config.group}
          version={descriptor.config.version}
          resourcePlural={descriptor.config.pluralName}
          onResult={onResult}
        />
      ))}
      <SidebarMenu>
        {nav.map((item) => (
          <SidebarMenuItemWithHover
            key={item.title}
            item={item}
            isMenuOpen={isMenuOpen}
            onToggle={toggleMenu}
            onOpenMenu={openMenu}
            onNavigate={closeMenusExcept}
            isMinimized={isMinimized}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
