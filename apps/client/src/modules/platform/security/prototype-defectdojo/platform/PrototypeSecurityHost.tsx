// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { PrototypeVariantSwitcher, type PrototypeVariant } from "../components/PrototypeVariantSwitcher";
import { PrototypeSecurityPage } from "./PrototypeSecurityPage";
import type { SecurityPrototypePage } from "./SecurityPrototypeView";
import type { SecurityOverviewVariantKey } from "./types";

/** Switcher key of the page as it is on main. Stands for an unset `variant` search parameter. */
const CURRENT = "current";

export interface PrototypeSecurityHostProps<K extends SecurityOverviewVariantKey> {
  page: SecurityPrototypePage;
  /** DefectDojo variants of the page. */
  variants: PrototypeVariant<K>[];
  /** Search parameter `variant`. Unset: `children` render. */
  variant: K | undefined;
  /** Search parameter `clusters`. */
  clusters: string | undefined;
  /** Search parameter `namespace`: the namespace the Vulnerabilities list starts on. */
  namespace?: string;
  /** Writes the search parameters of the host route. `undefined` removes a parameter. */
  onSearchChange: (patch: { variant: K | undefined; clusters: string | undefined }) => void;
  /** The page that reads Trivy custom resources. */
  children: React.ReactNode;
}

/**
 * Host of a Security page prototype on its existing route: the DefectDojo page when `?variant=` is
 * set, the current page otherwise. The floating switcher cycles through both.
 */
export function PrototypeSecurityHost<K extends SecurityOverviewVariantKey>({
  page,
  variants,
  variant,
  clusters,
  namespace,
  onSearchChange,
  children,
}: PrototypeSecurityHostProps<K>) {
  const switcherVariants = React.useMemo<PrototypeVariant<K | typeof CURRENT>[]>(
    () => [{ key: CURRENT, name: "Trivy custom resources" }, ...variants],
    [variants]
  );

  return (
    <>
      {variant === undefined ? (
        children
      ) : (
        <PrototypeSecurityPage
          page={page}
          variant={variant}
          clusters={clusters}
          namespace={namespace}
          onClustersChange={(next) => onSearchChange({ variant, clusters: next.join(",") })}
        />
      )}
      <PrototypeVariantSwitcher
        variants={switcherVariants}
        current={variant ?? CURRENT}
        onChange={(key) => onSearchChange({ variant: key === CURRENT ? undefined : key, clusters })}
      />
    </>
  );
}
