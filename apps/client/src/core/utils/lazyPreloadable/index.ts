import { createElement, lazy, type ComponentType } from "react";

export type PreloadableComponent<P extends object> = ComponentType<P> & {
  /** Fetches the chunk. Idempotent; errors are silent. */
  preload: () => void;
};

/**
 * Component over a module's named export; the chunk loads on first render or `preload()`.
 * Suspends until the chunk resolves; renders the export directly afterwards (no Suspense frame).
 * One import at a time. A rejected import is forgotten: the next `preload()` or first render imports again.
 * A rendered rejection reaches the error boundary; a later successful `preload()` recovers the component.
 */
export function lazyPreloadable<P extends object, K extends string>(
  loader: () => Promise<Record<K, ComponentType<P>>>,
  exportName: K
): PreloadableComponent<P> {
  let Resolved: ComponentType<P> | null = null;
  let pending: Promise<{ default: ComponentType<P> }> | null = null;

  const load = () =>
    (pending ??= loader()
      .then((m) => {
        Resolved = m[exportName];
        return { default: Resolved };
      })
      .catch((error: unknown) => {
        pending = null;
        throw error;
      }));
  const Lazy = lazy(load);

  function Preloadable(props: P) {
    return createElement(Resolved ?? Lazy, props);
  }
  Preloadable.preload = () => {
    load().catch(() => {});
  };

  return Preloadable;
}
