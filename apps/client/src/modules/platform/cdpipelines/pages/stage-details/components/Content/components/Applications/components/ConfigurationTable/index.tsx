import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import {
  StageAppCodebaseCombinedData,
  useWatchStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { useColumns } from "./hooks/useColumns";

export const ConfigurationTable = () => {
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();

  const columns = useColumns();

  // const [key, setKey] = React.useState(0);

  // const isDirty = Object.keys(dirtyFields).length > 0;

  // const timer = React.useRef<number | null>(null);

  // React.useEffect(() => {
  //   setKey((prev) => prev + 1);
  // }, [buttonsHighlighted]);

  return (
    <DataTable<StageAppCodebaseCombinedData>
      // key={key}
      id={TABLE.STAGE_APPLICATION_LIST_CONFIGURATION.id}
      name={TABLE.STAGE_APPLICATION_LIST_CONFIGURATION.name}
      isLoading={!stageAppCodebasesCombinedDataWatch.isFetched}
      data={stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData ?? []}
      columns={columns}
      settings={{
        show: false,
      }}
    />
  );
};
