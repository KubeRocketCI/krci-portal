import { MatchFunctions } from "@/core/providers/Filter";
import { QuickLink } from "@my-project/shared";
import { QuickLinkListFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const QUICKLINK_LIST_FILTER_NAMES = {
  SEARCH: "search",
} as const;

export const quickLinkFilterDefaultValues: QuickLinkListFilterValues = {
  [QUICKLINK_LIST_FILTER_NAMES.SEARCH]: "",
};

export const matchFunctions: MatchFunctions<QuickLink, QuickLinkListFilterValues> = {
  [QUICKLINK_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<QuickLink>(),
};
