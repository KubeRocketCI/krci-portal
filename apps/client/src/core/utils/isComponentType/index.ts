import * as React from "react";

/**
 * Checks if a value is a React component type (function component or forwardRef component).
 * This includes regular function components and forwardRef components from libraries like lucide-react.
 */
export const isComponentType = <TProps = Record<string, unknown>>(
  value: unknown
): value is React.ComponentType<TProps> => {
  if (typeof value === "function") {
    return true;
  }
  // Check for forwardRef components or other component-like objects
  // These are objects that can be rendered as JSX but aren't valid elements
  // They must have the $$typeof property that React uses for special components
  if (
    typeof value === "object" &&
    value !== null &&
    !React.isValidElement(value) &&
    !Array.isArray(value) &&
    "$$typeof" in value
  ) {
    return true;
  }
  return false;
};
