import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { CODEBASE_TYPE } from "@/core/k8s/constants/codebaseTypes";
import { TABLE } from "@/core/k8s/constants/tables";
import { k8sCodebaseConfig } from "@/core/k8s/crs/KRCI/Codebase";
import { k8sGitServerConfig } from "@/core/k8s/crs/KRCI/GitServer";
import { usePermissions } from "@/core/k8s/hooks/usePermissions";
import { useWatchList } from "@/core/k8s/hooks/useWatchList";
import { ResourcesSVGSprite } from "@/core/k8s/icons/sprites/Resources";
// import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { Table } from "@/core/components/Table";
import { Filter } from "@/core/providers/Filter/components/Filter";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { Codebase } from "@my-project/shared";
import { Plus, Trash } from "lucide-react";
import React from "react";
import { ComponentListFilterAllControlNames } from "../../types";
import { useColumns } from "./hooks/useColumns";
import { useFilter } from "./hooks/useFilter";
import { useSelection } from "./hooks/useSelection";

export const ComponentList = () => {
  const columns = useColumns();
  const codebases = useWatchList<Codebase>({
    group: k8sCodebaseConfig.group,
    version: k8sCodebaseConfig.apiVersion,
    resourcePlural: k8sCodebaseConfig.pluralName,
  });
  const gitServers = useWatchList({
    group: k8sGitServerConfig.group,
    version: k8sGitServerConfig.apiVersion,
    resourcePlural: k8sGitServerConfig.pluralName,
  });
  const codebasePermissions = usePermissions({
    group: k8sCodebaseConfig.group,
    version: k8sCodebaseConfig.apiVersion,
    resourcePlural: k8sCodebaseConfig.pluralName,
  });

  console.log(codebases);

  const noGitServers = !gitServers.data.items.size;

  // const { setDialog } = useDialogContext();

  // const [setDeleteDialogOpen] = React.useState(false);

  const emptyListComponent = React.useMemo(() => {
    if (codebases.isFetching || gitServers.isFetching || codebasePermissions.isFetching) {
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
          // setDialog(ManageCodebaseDialog, {
          //   codebaseData: undefined,
          //   gitServers: gitServers.data ?? undefined,
          // });
        }}
      />
    );
  }, [
    codebasePermissions.data.create.allowed,
    codebasePermissions.data.create.reason,
    codebasePermissions.isFetching,
    codebases.isFetching,
    gitServers.isFetching,
    noGitServers,
  ]);

  const { selected, handleSelectAllClick, handleSelectRowClick } = useSelection();
  const { controls, filterFunction } = useFilter();

  return (
    <>
      <ResourcesSVGSprite />
      <Stack direction="row" justifyContent="flex-end" alignItems="center">
        <ButtonWithPermission
          ButtonProps={{
            size: "medium",
            startIcon: <Plus />,
            color: "primary",
            variant: "contained",
            disabled: noGitServers,
            // onClick: () =>
            // setDialog(ManageCodebaseDialog, {
            //   codebaseData: undefined,
            //   gitServers: gitServers.data ?? undefined,
            // }),
          }}
          disabled={!codebasePermissions.data.create.allowed}
          reason={codebasePermissions.data.create.reason}
        >
          create component
        </ButtonWithPermission>
      </Stack>
      <Table<Codebase>
        id={TABLE.COMPONENT_LIST.id}
        name={TABLE.COMPONENT_LIST.name}
        data={Array.from(codebases.data.items.values())}
        isLoading={codebases.isFetching}
        // errors={codebases.errors}
        columns={columns}
        selection={{
          selected,
          handleSelectAll: handleSelectAllClick,
          handleSelectRow: handleSelectRowClick,
          isRowSelected: (row) => selected.indexOf(row.metadata.name) !== -1,
          isRowSelectable: (row) => row.spec.type !== CODEBASE_TYPE.SYSTEM,
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
                        disabled={!codebasePermissions.data.delete.allowed}
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
        slots={{
          header: <Filter<ComponentListFilterAllControlNames> controls={controls} />,
        }}
      />
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
