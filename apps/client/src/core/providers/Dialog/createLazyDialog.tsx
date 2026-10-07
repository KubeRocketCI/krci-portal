import React from "react";
import { lazyPreloadable, type PreloadableComponent } from "@/core/utils/lazyPreloadable";
import { DialogProps } from "./types";

/** `preload` fetches the implementation chunk. Bind it to the trigger's pointerenter and focus. */
export type LazyDialog<Props> = PreloadableComponent<DialogProps<Props>>;

/**
 * Dialog whose implementation chunk loads on first open. `name` is the provider key, `exportName` the module export.
 * Loading, preload and retry semantics: `lazyPreloadable`.
 */
export function createLazyDialog<Props, K extends string>(
  name: string,
  loader: () => Promise<Record<K, React.ComponentType<DialogProps<Props>>>>,
  exportName: K
): LazyDialog<Props> {
  const LazyDialog = lazyPreloadable(loader, exportName);
  LazyDialog.displayName = name;
  return LazyDialog;
}
