import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { TABLE } from "@/k8s/constants/tables";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { Table } from "@/core/components/Table";
import { useCodebasePermissions, useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseDialog } from "@/modules/platform/codebases/dialogs/ManageCodebase";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { codebaseType, type Codebase } from "@my-project/shared";
import { Plus, Trash } from "lucide-react";
import React, { Suspense } from "react";
import { CodebaseFilter } from "../CodebaseFilter";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "./hooks/useSelection";
import { useCodebaseFilter } from "../CodebaseFilter/hooks/useFilter";

export const ComponentList = () => {
  const columns = useColumns();
  const codebaseListWatch = useCodebaseWatchList();
  const codebasePermissions = useCodebasePermissions();

  const gitServerListWatch = useGitServerWatchList();

  const noGitServers = gitServerListWatch.isEmpty;

  const { setDialog } = useDialogContext();

  // const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const emptyListComponent = React.useMemo(() => {
    if (codebaseListWatch.query.isFetching || gitServerListWatch.query.isFetching || codebasePermissions.isFetching) {
      return null;
    }

    if (!codebasePermissions.data.create.allowed) {
      return <EmptyList customText={codebasePermissions.data.create.reason} />;
    }

    if (noGitServers) {
      return (
        <EmptyList
          customText={"No Git Servers Connected."}
          linkText={"Click here to add a Git Server."}
          // handleClick={() => history.push(gitServersConfigurationPageRoute)}
        />
      );
    }

    return (
      <EmptyList
        customText={"Let's kickstart the application onboarding!"}
        linkText={"Click here to add a new application and integrate with the platform."}
        handleClick={() => {
          setDialog(ManageCodebaseDialog, {
            codebase: undefined,
          });
        }}
      />
    );
  }, [
    codebaseListWatch.query.isFetching,
    codebasePermissions.data.create.allowed,
    codebasePermissions.data.create.reason,
    codebasePermissions.isFetching,
    gitServerListWatch.query.isFetching,
    noGitServers,
    setDialog,
  ]);

  const { selected, handleSelectAllClick, handleSelectRowClick } = useSelection();
  const { filterFunction } = useCodebaseFilter();

  const tableSlots = React.useMemo(
    () => ({
      header: <CodebaseFilter />,
    }),
    []
  );

  return (
    <>
      <K8sRelatedIconsSVGSprite />
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          <ButtonWithPermission
            ButtonProps={{
              size: "medium",
              startIcon: <Plus />,
              color: "primary",
              variant: "contained",
              disabled: noGitServers,
              onClick: () =>
                setDialog(ManageCodebaseDialog, {
                  codebase: undefined,
                }),
            }}
            allowed={codebasePermissions.data.create.allowed}
            reason={codebasePermissions.data.create.reason}
          >
            create component
          </ButtonWithPermission>
        </Stack>
        <Suspense fallback={<div>Loading...</div>}>
          <Table<Codebase>
            id={TABLE.COMPONENT_LIST.id}
            name={TABLE.COMPONENT_LIST.name}
            data={codebaseListWatch.dataArray}
            isLoading={codebaseListWatch.query.isFetching}
            // errors={codebases.errors}
            columns={columns}
            selection={{
              selected,
              handleSelectAll: handleSelectAllClick,
              handleSelectRow: handleSelectRowClick,
              isRowSelected: (row) => selected.indexOf(row.metadata.name) !== -1,
              isRowSelectable: (row) => row.spec.type !== codebaseType.system,
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
                        condition={codebasePermissions.data.delete.allowed}
                        wrapper={(children) => (
                          <Tooltip title={"Delete selected components"}>
                            <div>{children}</div>
                          </Tooltip>
                        )}
                      >
                        <Box sx={{ color: (t) => t.palette.secondary.dark }}>
                          <ButtonWithPermission
                            ButtonProps={{
                              size: "small",
                              disabled: !selectionLength,
                              // onClick: () => {
                              //   setDeleteDialogOpen(true);
                              // },
                              startIcon: <Trash />,
                              variant: "outlined",
                              color: "inherit",
                            }}
                            allowed={codebasePermissions.data.delete.allowed}
                            reason={codebasePermissions.data.delete.reason}
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
            filterFunction={filterFunction}
            emptyListComponent={emptyListComponent}
            slots={tableSlots}
          />
        </Suspense>
      </Stack>
      {/* {deleteDialogOpen && (
        <ComponentMultiDeletion
          open={deleteDialogOpen}
          handleClose={() => setDeleteDialogOpen(false)}
          onDelete={() => {
            setDeleteDialogOpen(false);
            setSelected([]);
          }}
          components={codebases.data!}
          selected={selected}
        />
      )} */}
    </>
  );
};
