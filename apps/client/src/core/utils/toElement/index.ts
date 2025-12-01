import * as React from "react";
import { isComponentType } from "../isComponentType";

/**
 * Converts a React component type or ReactNode to a React element.
 * If the value is already a valid React element or primitive, returns it as-is.
 * If it's a component type, renders it with the provided props.
 */
export const toElement = (
  nodeOrComponent: React.ReactNode | React.ComponentType<Record<string, unknown>>,
  extraProps: Record<string, unknown> = {}
) => {
  if (React.isValidElement(nodeOrComponent)) {
    return React.cloneElement(nodeOrComponent, extraProps);
  }
  if (isComponentType(nodeOrComponent)) {
    return React.createElement(nodeOrComponent, extraProps);
  }
  return nodeOrComponent; // string | number | null
};
