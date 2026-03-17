import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";
import { useShallow } from "zustand/react/shallow";
import { useClusterStore } from "@/k8s/store";
import { QuickLinkFilter } from "../QuickLinkFilter";
import { useQuickLinkFilter } from "../QuickLinkFilter/hooks/useFilter";
import { ComponentCard } from "@/modules/platform/overview/pages/details/components/QuickLinkList/components/ComponentCard";
import { AddNewQuickLinkCard } from "@/modules/platform/overview/pages/details/components/QuickLinkList/components/AddNewQuickLinkCard";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const QuickLinkList = () => {
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const quickLinksWatch = useQuickLinkWatchList({ namespace });
  const { filterFunction } = useQuickLinkFilter();

  const filteredItems = quickLinksWatch.data.array.filter(filterFunction);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        <QuickLinkFilter />
      </div>
      <LoadingWrapper isLoading={!quickLinksWatch.isReady}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((el) => (
            <ComponentCard key={el.metadata.uid} component={el} />
          ))}
          <AddNewQuickLinkCard />
        </div>
      </LoadingWrapper>
    </div>
  );
};
