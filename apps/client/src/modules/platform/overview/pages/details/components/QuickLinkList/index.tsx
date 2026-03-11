import { AddNewQuickLinkCard } from "./components/AddNewQuickLinkCard";
import { ComponentCard } from "./components/ComponentCard";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";

export const QuickLinkList = () => {
  const quickLinkListWatch = useQuickLinkWatchList();
  const quickLinkList = quickLinkListWatch.data.array;

  return quickLinkListWatch.query.error ? (
    <ErrorContent error={quickLinkListWatch.query.error} outlined />
  ) : (
    <LoadingWrapper isLoading={quickLinkListWatch.query.isFetching}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {quickLinkList.map((el) => {
          return el.spec.visible ? <ComponentCard key={el.metadata.uid} component={el} /> : null;
        })}
        <AddNewQuickLinkCard />
      </div>
    </LoadingWrapper>
  );
};
