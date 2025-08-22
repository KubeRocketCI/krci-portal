import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Table } from "@/core/components/Table";
import { useApplicationPermissions } from "@/k8s/api/groups/ArgoCD/Application";
import { TABLE } from "@/k8s/constants/tables";
import {
  StageAppCodebaseCombinedData,
  useWatchStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Box, Stack, Typography, Tooltip } from "@mui/material";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "../../hooks/useSelection";
import { Trash } from "lucide-react";
import { useButtonsEnabledMap } from "../../hooks/useButtonsEnabled";

export const PreviewTable = () => {
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();

  const applicationPermissions = useApplicationPermissions();

  const columns = useColumns();

  const { selected, handleClickSelectAll, handleClickSelectRow } = useSelection();
  const buttonsEnabledMap = useButtonsEnabledMap();

  return (
    <>
      <Table<StageAppCodebaseCombinedData>
        id={TABLE.STAGE_APPLICATION_LIST_PREVIEW.id}
        name={TABLE.STAGE_APPLICATION_LIST_PREVIEW.name}
        isLoading={!stageAppCodebasesCombinedDataWatch.isFetched}
        data={stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData ?? []}
        columns={columns}
        selection={{
          selected,
          isRowSelected: (row) => selected.indexOf(row.appCodebase.metadata.name) !== -1,
          handleSelectAll: handleClickSelectAll,
          handleSelectRow: handleClickSelectRow,
          renderSelectionInfo: (selectionLength) => (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box
                sx={{
                  visibility: selectionLength ? "visible" : "hidden",
                  pointerEvents: selectionLength ? "auto" : "none",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ minWidth: (t) => t.typography.pxToRem(150) }}>
                    <Typography variant="body1">{selectionLength} item(s) selected</Typography>
                  </Box>
                  <ConditionalWrapper
                    condition={applicationPermissions.data?.delete.allowed}
                    wrapper={(children) => (
                      <Tooltip title="Uninstall selected applications">
                        <div>{children}</div>
                      </Tooltip>
                    )}
                  >
                    <Box sx={{ color: (t) => t.palette.secondary.dark }}>
                      <ButtonWithPermission
                        ButtonProps={{
                          size: "small",
                          variant: "outlined",
                          color: "inherit",
                          startIcon: <Trash size={16} />,
                          // onClick: () => setDeleteDialogOpen(true),
                          disabled: !selectionLength || !buttonsEnabledMap.uninstall,
                        }}
                        allowed={applicationPermissions.data?.delete.allowed}
                        reason={applicationPermissions.data?.delete.reason}
                      >
                        delete
                      </ButtonWithPermission>
                    </Box>
                  </ConditionalWrapper>
                </Stack>
              </Box>
            </Stack>
          ),
        }}
        settings={{
          show: false,
        }}
      />
      {/* <ApplicationsMultiDeletion
        applications={allArgoApplications}
        selected={selected}
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        onDelete={() => {
          setSelected([]);
          setDeleteDialogOpen(false);
        }}
        deleteArgoApplication={deleteArgoApplication}
      /> */}
    </>
  );
};
