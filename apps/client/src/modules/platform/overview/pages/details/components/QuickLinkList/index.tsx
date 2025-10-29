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
      <div className="grid grid-cols-4 sm:grid-cols-3 xl:grid-cols-5 gap-6">
        {quickLinkList.map((el) => {
          return el.spec.visible ? (
            <div className="col-span-1" key={el.metadata.uid}>
              <ComponentCard component={el} />
            </div>
          ) : null;
        })}
        <div className="col-span-1">
          <AddNewQuickLinkCard />
        </div>
      </div>
    </LoadingWrapper>
  );
};
