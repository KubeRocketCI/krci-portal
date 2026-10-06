import React, { lazy } from "react";
import { DialogProps } from "./types";

export type LazyDialog<Props> = React.ComponentType<DialogProps<Props>> & {
  /** Fetches the implementation chunk. Idempotent. Bind to the trigger's pointerenter and focus. */
  preload: () => void;
};

/**
 * Dialog whose implementation chunk loads on first open. `name` is the provider key, `exportName` the module export.
 * Once the chunk resolved (open or preload) the dialog renders without Suspense, so no loading shell frame.
 */
export function createLazyDialog<Props, K extends string>(
  name: string,
  loader: () => Promise<Record<K, React.ComponentType<DialogProps<Props>>>>,
  exportName: K
): LazyDialog<Props> {
  let Resolved: React.ComponentType<DialogProps<Props>> | null = null;
  let pending: Promise<{ default: React.ComponentType<DialogProps<Props>> }> | null = null;

  // One import per factory. A rejected import is forgotten so the next open retries it.
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

  function LazyDialog(props: DialogProps<Props>) {
    return Resolved ? <Resolved {...props} /> : <Lazy {...props} />;
  }
  LazyDialog.displayName = name;
  // A failed preload is silent; the error resurfaces through Suspense when the dialog opens.
  LazyDialog.preload = () => {
    load().catch(() => {});
  };

  return LazyDialog;
}
