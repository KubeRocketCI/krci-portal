import { Template } from "@my-project/shared";

export const defaultValues = {
  search: "",
  codebaseType: "all",
} as const;

export const matchFunctions = {
  search: (item: Template, value: string) => {
    if (!value) return true;
    const v = value.toLowerCase().trim();
    return item?.spec?.displayName?.toLowerCase().includes(v) || item?.metadata?.name?.toLowerCase().includes(v);
  },
  codebaseType: (item: Template, value: string) => {
    if (!value || value === "all") return true;
    // value is one of keys of codebaseType map
    return item?.spec?.type === value;
  },
} as const;
