import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { TABLE } from "@/k8s/constants/tables";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { DataTable } from "@/core/components/Table";
import { useCodebasePermissions, useCodebaseWatchListMultiple } from "@/k8s/api/groups/KRCI/Codebase";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseDialog } from "@/modules/platform/codebases/dialogs/ManageCodebase";
import { Tooltip } from "@/core/components/ui/tooltip";
import { codebaseType, type Codebase } from "@my-project/shared";
import { Plus, Trash } from "lucide-react";
import React, { Suspense } from "react";
import { CodebaseFilter } from "../CodebaseFilter";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "./hooks/useSelection";
import { useCodebaseFilter } from "../CodebaseFilter/hooks/useFilter";
import { ComponentMultiDeletion } from "./components/ComponentMultiDeletion";

export const ComponentList = () => {
  const columns = useColumns();
  const codebaseListWatch = useCodebaseWatchListMultiple();

  const codebasePermissions = useCodebasePermissions();

  const gitServerListWatch = useGitServerWatchList();

  const noGitServers = gitServerListWatch.isEmpty;

  const { setDialog } = useDialogContext();

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
        handleClick={() => {
          setDialog(ManageCodebaseDialog, {
            codebase: undefined,
          });
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
    setDialog,
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
      <K8sRelatedIconsSVGSprite />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end">
          <ButtonWithPermission
            ButtonProps={{
              variant: "default",
              disabled: noGitServers,
              onClick: () =>
                setDialog(ManageCodebaseDialog, {
                  codebase: undefined,
                }),
            }}
            allowed={codebasePermissions.data.create.allowed}
            reason={codebasePermissions.data.create.reason}
          >
            <Plus />
            Create Component
          </ButtonWithPermission>
        </div>
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
