import { KubeObjectBase } from "@my-project/shared";

export const createSearchMatchFunction =
  <T extends KubeObjectBase>() =>
  (item: T, value: string): boolean => {
    if (!item || !value || typeof value !== "string") {
      return true;
    }

    const searchValue = value.toLowerCase().trim();

    if (searchValue.includes(":")) {
      const cleanedValue = searchValue.replaceAll(" ", "");
      const [key, searchValueForKey] = cleanedValue.split(":");

      return !!item?.metadata?.labels?.[key]?.toLowerCase()?.includes(searchValueForKey);
    }

    return (
      Object.keys(item?.metadata?.labels || {}).some((labelKey) => labelKey.toLowerCase().includes(searchValue)) ||
      item?.metadata?.name?.toLowerCase().includes(searchValue)
    );
  };

export const createNamespaceMatchFunction =
  <T extends KubeObjectBase>() =>
  (item: T, value: string[]): boolean => {
    if (!value || !Array.isArray(value)) {
      return true;
    }

    return value.length === 0 || value.includes(item.metadata?.namespace || "");
  };

export const createExactMatchFunction =
  <T, V extends string>(getValue: (item: T) => V | undefined) =>
  (item: T, filterValue: string): boolean => {
    if (!filterValue || filterValue === "all") {
      return true;
    }

    return getValue(item) === filterValue;
  };

export const createArrayIncludesMatchFunction =
  <T>(getValue: (item: T) => string | undefined) =>
  (item: T, filterValue: string[]): boolean => {
    if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
      return true;
    }

    const itemValue = getValue(item);
    return itemValue ? filterValue.includes(itemValue) : false;
  };

export const createLabelMatchFunction =
  <T extends KubeObjectBase>(labelKey: string) =>
  (item: T, value: string): boolean => {
    if (!value || value === "all") {
      return true;
    }

    return item?.metadata?.labels?.[labelKey] === value;
  };

export const createBooleanMatchFunction =
  <T>(getValue: (item: T) => boolean | undefined) =>
  (item: T, filterValue: boolean): boolean => {
    if (!filterValue) {
      return true;
    }

    return getValue(item) === true;
  };
