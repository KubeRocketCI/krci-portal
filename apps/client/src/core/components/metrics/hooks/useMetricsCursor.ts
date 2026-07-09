import * as React from "react";

type Listener = () => void;

export class CursorStore {
  private value: number | null = null;
  private listeners = new Set<Listener>();

  get = (): number | null => this.value;

  set = (next: number | null): void => {
    if (this.value === next) return;
    this.value = next;
    this.listeners.forEach((l) => l());
  };

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
}

export const CursorStoreContext = React.createContext<CursorStore | null>(null);

export interface UseMetricsCursorResult {
  cursorTs: number | null;
  setCursorTs: (next: number | null) => void;
}

// Stable no-op handles for callers used outside a MetricsCursorProvider
// (Storybook, isolated tests). Defined at module scope so identity stays
// stable across renders.
const NOOP_SUBSCRIBE = () => () => {};
const NOOP_GET = (): number | null => null;
const NOOP_SET = (): void => {};

export function useMetricsCursor(): UseMetricsCursorResult {
  const store = React.useContext(CursorStoreContext);
  const cursorTs = React.useSyncExternalStore(
    store ? store.subscribe : NOOP_SUBSCRIBE,
    store ? store.get : NOOP_GET,
    store ? store.get : NOOP_GET
  );
  return { cursorTs, setCursorTs: store ? store.set : NOOP_SET };
}
