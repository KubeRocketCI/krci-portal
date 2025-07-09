import { KubeObjectBase } from "@my-project/shared";

// Default search function for any KubeObjectBase
export const searchFunction = (item: KubeObjectBase, value: string | string[] | boolean): boolean => {
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
    item?.metadata?.name?.toLowerCase().includes(searchValue) ||
    //@ts-expect-error temporary fix for displayName
    item?.spec?.displayName?.toLowerCase().includes(searchValue)
  );
};

// Default namespace function for any KubeObjectBase
export const namespaceFunction = (item: KubeObjectBase, value: string | string[] | boolean): boolean => {
  if (!value || !Array.isArray(value)) {
    return true;
  }

  return value.length === 0 || value.includes(item.metadata?.namespace || "");
};
