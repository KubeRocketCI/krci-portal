import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useCodebasePermissions, useCodebaseWatchListMultiple } from "@/k8s/api/groups/KRCI/Codebase";
import { useGitServerPermissions, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import { TABLE } from "@/k8s/constants/tables";
import { codebaseType, type Codebase } from "@my-project/shared";
import { Trash } from "lucide-react";
import React, { Suspense } from "react";
import { routeGitserversConfiguration } from "../../../../../configuration/modules/gitservers/route";
import { routeProjectCreate } from "../../../create/route";
import { CodebaseFilter } from "../CodebaseFilter";
import { useCodebaseFilter } from "../CodebaseFilter/hooks/useFilter";
import { ComponentMultiDeletion } from "./components/ComponentMultiDeletion";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "./hooks/useSelection";

export const ComponentList = () => {
  const columns = useColumns();
  const { form, filterFunction } = useCodebaseFilter();

  // Only fetch from filtered namespaces if they're specified
  const namespacesToWatch = React.useMemo(() => {
    const namespaces = form.state.values.namespaces;
    return namespaces && namespaces.length > 0 ? namespaces : undefined;
  }, [form.state.values.namespaces]);

  const codebaseListWatch = useCodebaseWatchListMultiple({
    namespaces: namespacesToWatch,
  });

  const codebasePermissions = useCodebasePermissions();

  const gitServerListWatch = useGitServerWatchList();
  const gitServerPermissions = useGitServerPermissions();

  const noGitServers = gitServerListWatch.isEmpty;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const emptyListComponent = React.useMemo(() => {
    if (
      codebaseListWatch.isLoading ||
      gitServerListWatch.isLoading ||
      codebasePermissions.isFetching ||
      gitServerPermissions.isFetching
    ) {
      return null;
    }

    if (!codebasePermissions.data.create.allowed) {
      return <EmptyList customText={codebasePermissions.data.create.reason} />;
    }

    if (noGitServers) {
      if (!gitServerPermissions.data.create.allowed) {
        return (
          <EmptyList
            customText={"No Git Servers Connected."}
            beforeLinkText={gitServerPermissions.data.create.reason}
          />
        );
      }

      return (
        <EmptyList
          customText={"No Git Servers Connected."}
          linkText={"Click here to add a Git Server."}
          route={{
            to: routeGitserversConfiguration.fullPath,
          }}
        />
      );
    }

    return (
      <EmptyList
        customText={"Let's kickstart the application onboarding!"}
        linkText={"Click here to add a new application and integrate with the platform."}
        route={{
          to: routeProjectCreate.fullPath,
        }}
      />
    );
  }, [
    codebaseListWatch.isLoading,
    codebasePermissions.data.create.allowed,
    codebasePermissions.data.create.reason,
    codebasePermissions.isFetching,
    gitServerListWatch.isLoading,
    gitServerPermissions.data.create.allowed,
    gitServerPermissions.data.create.reason,
    gitServerPermissions.isFetching,
    noGitServers,
  ]);

  const { selected, setSelected, handleSelectAllClick, handleSelectRowClick } = useSelection();

  const tableSlots = React.useMemo(
    () => ({
      header: <CodebaseFilter />,
    }),
    []
  );

  const formattedErrors = React.useMemo(() => {
    if (!codebaseListWatch.errors || codebaseListWatch.errors.length === 0) {
      return undefined;
    }

    return codebaseListWatch.errors.map((error) => {
      const errorMessage = getK8sErrorMessage(error);
      const formattedError = new Error(errorMessage);
      return formattedError;
    });
  }, [codebaseListWatch.errors]);

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
            errors={formattedErrors}
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
                        <p>{selectionLength} item(s) selected</p>
                      </div>
                      <ConditionalWrapper
                        condition={codebasePermissions.data.delete.allowed}
                        wrapper={(children) => (
                          <Tooltip title={"Delete selected projects"}>
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
