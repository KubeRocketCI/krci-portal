import { FilterProvider } from "@/core/providers/Filter";
import PageView from "./view";
import { QuickLink } from "@my-project/shared";
import { QuickLinkListFilterValues } from "./components/QuickLinkFilter/types";
import { quickLinkFilterDefaultValues, matchFunctions } from "./components/QuickLinkFilter/constants";

export default function QuickLinkListPage() {
  return (
    <FilterProvider<QuickLink, QuickLinkListFilterValues>
      defaultValues={quickLinkFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
