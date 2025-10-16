import { CustomKubeObjectList } from "../watch-types";
import { KubeObjectBase } from "@my-project/shared";

/**
 * Creates a select function that applies transform to list items
 */
export const createListSelectFn = <I extends KubeObjectBase>(
  transform?: (items: Map<string, I>, listMetadata: CustomKubeObjectList<I>) => Map<string, I>
) => {
  if (!transform) return undefined;

  return (data: CustomKubeObjectList<I>) => ({
    ...data,
    items: transform(data.items, data),
  });
};

/**
 * Creates a select function that applies transform to a single item
 */
export const createItemSelectFn = <I extends KubeObjectBase>(transform?: (item: I) => I) => {
  if (!transform) return undefined;

  return (data: I) => (data ? transform(data) : data);
};
