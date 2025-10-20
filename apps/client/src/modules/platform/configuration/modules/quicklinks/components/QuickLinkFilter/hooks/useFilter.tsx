import { useFilterContext } from "@/core/providers/Filter";
import { QuickLink } from "@my-project/shared";
import { QuickLinkListFilterValues } from "../types";

export const useQuickLinkFilter = () => useFilterContext<QuickLink, QuickLinkListFilterValues>();
