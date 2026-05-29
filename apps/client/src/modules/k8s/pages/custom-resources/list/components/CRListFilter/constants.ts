import { createSearchMatchFunction, type MatchFunctions } from "@/core/providers/Filter";
import { extractByJsonPath } from "@/modules/k8s/utils/extractByJsonPath";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";
import { printerColumnFilterKey, type CRListFilterValues } from "./types";

export const crListFilterControlNames = {
  SEARCH: "search",
} as const;

export type PrinterColMeta = NonNullable<CRDObject["spec"]["versions"][number]["additionalPrinterColumns"]>[number];

export const buildCRListDefaultValues = (printerCols: PrinterColMeta[], initialSearch = ""): CRListFilterValues => ({
  [crListFilterControlNames.SEARCH]: initialSearch,
  ...Object.fromEntries(printerCols.map((c) => [printerColumnFilterKey(c.name), [] as string[]])),
});

export const buildCRListMatchFunctions = (
  printerCols: PrinterColMeta[]
): MatchFunctions<KubeObjectBase, CRListFilterValues> => {
  const search = createSearchMatchFunction<KubeObjectBase>();
  // `CRListFilterValues` carries an index signature (so dynamic `pc:*` keys
  // type-check inside `form.AppField`), which forces `MatchFunctions` to widen
  // each value type to `unknown`. Narrow back at runtime when calling each fn —
  // the FilterProvider only ever passes the value it stored for that field.
  return {
    [crListFilterControlNames.SEARCH]: (item: KubeObjectBase, v: unknown) => search(item, v as string),
    ...Object.fromEntries(
      printerCols.map((c) => [
        printerColumnFilterKey(c.name),
        (item: KubeObjectBase, v: unknown) => {
          const arr = (v as string[] | undefined) ?? [];
          if (!arr.length) return true;
          return arr.includes(String(extractByJsonPath(item, c.jsonPath)));
        },
      ])
    ),
  };
};
