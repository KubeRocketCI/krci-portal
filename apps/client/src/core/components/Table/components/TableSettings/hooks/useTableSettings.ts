import React from "react";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { SavedTableSettings, SavedTableSettingsEntry, SavedTableSettingsPatch } from "../types";

const LS_KEY_TABLE_SETTINGS = "tableSettings";

/** The whole localStorage envelope, keyed by table id. Internal to this module. */
type TableSettingsStore = Record<string, SavedTableSettings>;

export const useTableSettings = (tableId: string) => {
  const loadSettings = React.useCallback(
    (): SavedTableSettings => LOCAL_STORAGE_SERVICE.getItem(LS_KEY_TABLE_SETTINGS)?.[tableId] ?? {},
    [tableId]
  );

  /**
   * Shallow-merges `patch` into this table's per-column entries. Other tables are
   * untouched. Merge, never replace: width and visibility patch independently.
   */
  const patchColumnSettings = React.useCallback(
    (patch: SavedTableSettingsPatch): void => {
      const store: TableSettingsStore = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_TABLE_SETTINGS) ?? {};
      const table: SavedTableSettings = { ...(store[tableId] ?? {}) };

      for (const [columnId, changes] of Object.entries(patch)) {
        const entry: SavedTableSettingsEntry = { ...table[columnId], id: columnId };

        if (changes.show !== undefined) {
          entry.show = changes.show;
        }

        if (changes.width === null) {
          delete entry.width;
        } else if (changes.width !== undefined) {
          entry.width = changes.width;
        }

        // An entry carrying nothing but its id is noise.
        if (entry.show === undefined && entry.width === undefined) {
          delete table[columnId];
        } else {
          table[columnId] = entry;
        }
      }

      const next: TableSettingsStore = { ...store, [tableId]: table };
      if (Object.keys(table).length === 0) {
        delete next[tableId];
      }

      LOCAL_STORAGE_SERVICE.setItem(LS_KEY_TABLE_SETTINGS, next);
    },
    [tableId]
  );

  return { loadSettings, patchColumnSettings };
};
