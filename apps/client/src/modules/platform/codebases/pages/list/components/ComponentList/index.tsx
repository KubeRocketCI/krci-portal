import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useCodebasePermissions, useCodebaseWatchListMultiple } from "@/k8s/api/groups/KRCI/Codebase";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { TABLE } from "@/k8s/constants/tables";
import { codebaseType, type Codebase } from "@my-project/shared";
import { Trash } from "lucide-react";
import React, { Suspense } from "react";
import { routeCodebaseCreate } from "../../../create/route";
import { CodebaseFilter } from "../CodebaseFilter";
import { useCodebaseFilter } from "../CodebaseFilter/hooks/useFilter";
import { ComponentMultiDeletion } from "./components/ComponentMultiDeletion";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "./hooks/useSelection";

export const ComponentList = () => {
  const columns = useColumns();
  const codebaseListWatch = useCodebaseWatchListMultiple();

  const codebasePermissions = useCodebasePermissions();

  const gitServerListWatch = useGitServerWatchList();

  const noGitServers = gitServerListWatch.isEmpty;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const emptyListComponent = React.useMemo(() => {
    if (codebaseListWatch.isLoading || gitServerListWatch.isLoading || codebasePermissions.isFetching) {
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
        route={{
          to: routeCodebaseCreate.fullPath,
        }}
      />
    );
  }, [
    codebaseListWatch.isLoading,
    codebasePermissions.data.create.allowed,
    codebasePermissions.data.create.reason,
    codebasePermissions.isFetching,
    gitServerListWatch.isLoading,
    noGitServers,
  ]);

  const { selected, setSelected, handleSelectAllClick, handleSelectRowClick } = useSelection();
  const { filterFunction } = useCodebaseFilter();

  const tableSlots = React.useMemo(
    () => ({
      header: <CodebaseFilter />,
    }),
    []
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end"></div>
        <Suspense fallback={<div>Loading...</div>}>
          <DataTable<Codebase>
            id={TABLE.COMPONENT_LIST.id}
            name={TABLE.COMPONENT_LIST.name}
            data={codebaseListWatch.data.array}
            isLoading={codebaseListWatch.isLoading}
            errors={codebaseListWatch.errors}
            columns={columns}
            selection={{
              selected,
              handleSelectAll: handleSelectAllClick,
              handleSelectRow: handleSelectRowClick,
              isRowSelected: (row) => selected.indexOf(row.metadata.name) !== -1,
              isRowSelectable: (row) => row.spec.type !== codebaseType.system,
              renderSelectionInfo: (selectionLength) => (
                <div className="flex items-center justify-between">
                  <div className={selectionLength ? "visible" : "pointer-events-none invisible"}>
                    <div className="flex items-center gap-2">
                      <div className="min-w-38">
                        <p className="text-base">{selectionLength} item(s) selected</p>
                      </div>
                      <ConditionalWrapper
                        condition={codebasePermissions.data.delete.allowed}
                        wrapper={(children) => (
                          <Tooltip title={"Delete selected components"}>
                            <div>{children}</div>
                          </Tooltip>
                        )}
                      >
                        <div className="text-secondary-700">
                          <ButtonWithPermission
                            ButtonProps={{
                              size: "sm",
                              variant: "outline",
                              disabled: !selectionLength,
                              onClick: () => {
                                setDeleteDialogOpen(true);
                              },
                            }}
                            allowed={codebasePermissions.data.delete.allowed}
                            reason={codebasePermissions.data.delete.reason}
                          >
                            <Trash />
                            Delete
                          </ButtonWithPermission>
                        </div>
                      </ConditionalWrapper>
                    </div>
                  </div>
                </div>
              ),
            }}
            filterFunction={filterFunction}
            emptyListComponent={emptyListComponent}
            slots={tableSlots}
          />
        </Suspense>
      </div>
      {deleteDialogOpen && (
        <ComponentMultiDeletion
          open={deleteDialogOpen}
          handleClose={() => setDeleteDialogOpen(false)}
          onDelete={() => {
            setDeleteDialogOpen(false);
            setSelected([]);
          }}
          components={codebaseListWatch.data.array}
          selected={selected}
        />
      )}
    </>
  );
};
