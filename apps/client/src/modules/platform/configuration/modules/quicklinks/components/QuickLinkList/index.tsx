import { Table } from "@/core/components/Table";
import { useColumns } from "./hooks/useColumns";
import { TABLE } from "@/k8s/constants/tables";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";
import { useShallow } from "zustand/react/shallow";
import { useClusterStore } from "@/k8s/store";
import { useFilterContext } from "@/core/providers/Filter/hooks";

export const QuickLinkList = () => {
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const columns = useColumns();

  const quickLinksWatch = useQuickLinkWatchList({
    namespace,
  });

  const { filterFunction } = useFilterContext();

  return (
    <>
      <Table
        id={TABLE.QUICKLINK_LIST.id}
        name={TABLE.QUICKLINK_LIST.name}
        isLoading={!quickLinksWatch.isReady}
        data={quickLinksWatch.dataArray}
        errors={[]}
        columns={columns}
        filterFunction={filterFunction}
      />
    </>
  );
};
