// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";

export interface PrototypeRequestLogEntry {
  procedure: string;
  state: string;
  /** Upstream DefectDojo GET paths the procedure call made. */
  requests: string[];
}

export interface PrototypeRequestLog {
  record(entry: PrototypeRequestLogEntry): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): PrototypeRequestLogEntry[];
}

/** In-memory log of the DefectDojo requests behind the tRPC calls of one mounted variant. */
export function createPrototypeRequestLog(): PrototypeRequestLog {
  let entries: PrototypeRequestLogEntry[] = [];
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    record(entry) {
      entries = [...entries, entry];
      emit();
    },
    clear() {
      entries = [];
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return entries;
    },
  };
}

export function usePrototypeRequestLogEntries(log: PrototypeRequestLog): PrototypeRequestLogEntry[] {
  return React.useSyncExternalStore(log.subscribe, log.getSnapshot);
}
