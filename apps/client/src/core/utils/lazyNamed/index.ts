import React, { lazy } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

/** React.lazy over a module's named export. */
export function lazyNamed<K extends string, C extends AnyComponent>(
  loader: () => Promise<Record<K, C>>,
  exportName: K
): React.LazyExoticComponent<C> {
  return lazy(() => loader().then((m) => ({ default: m[exportName] })));
}
