// Shared types for TanStack Form components

export interface SelectOption {
  label: string | React.ReactNode;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  /** Matched by searchable combobox filters (cmdk keywords). */
  keywords?: string[];
  /** See `ComboboxOption.kind`. Honored by standard (non-renderOption) Combobox variants. */
  kind?: "item" | "separator";
}

// Re-export React for convenience
import type React from "react";
