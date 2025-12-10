import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import {
  StageAppCodebaseCombinedData,
  useStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { useColumns } from "./hooks/useColumns";

export const ConfigurationTable = () => {
  const stageAppCodebasesCombinedData = useStageAppCodebasesCombinedData();

  const columns = useColumns();

  return (
    <DataTable<StageAppCodebaseCombinedData>
      id={TABLE.STAGE_APPLICATION_LIST_CONFIGURATION.id}
      name={TABLE.STAGE_APPLICATION_LIST_CONFIGURATION.name}
      isLoading={stageAppCodebasesCombinedData.isLoading}
      data={stageAppCodebasesCombinedData.stageAppCodebasesCombinedData}
      columns={columns}
      settings={{
        show: false,
      }}
    />
  );
};
