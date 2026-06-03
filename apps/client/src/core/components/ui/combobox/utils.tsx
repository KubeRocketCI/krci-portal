import * as React from "react";
import type { ComboboxOption } from "./index";

/**
 * Case-insensitive substring filter over an option's value, string label, and
 * keywords. Returns all options when `search` is empty/whitespace. Shared by the
 * free-text combobox variants, which disable cmdk's built-in filtering and drive
 * the option list themselves.
 */
export function filterComboboxOptions(options: ComboboxOption[], search: string): ComboboxOption[] {
  const term = search.trim().toLowerCase();
  if (!term) return options;
  return options.filter((option) => {
    if (option.value.toLowerCase().includes(term)) return true;
    if (typeof option.label === "string" && option.label.toLowerCase().includes(term)) return true;
    return option.keywords?.some((keyword) => keyword.toLowerCase().includes(term)) ?? false;
  });
}

/** Render an option's content, preferring a caller-supplied `renderOption`. */
export function renderComboboxOption(
  option: ComboboxOption,
  renderOption?: (option: ComboboxOption) => React.ReactNode
): React.ReactNode {
  if (renderOption) return renderOption(option);
  return typeof option.label === "string" ? <span className="truncate">{option.label}</span> : option.label;
}
