import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useFilterContext } from "@/core/providers/Filter/hooks";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useTemplatePermissions, useTemplateWatchList } from "@/k8s/api/groups/KRCI/Template";
import { TABLE } from "@/k8s/constants/tables";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Template } from "@my-project/shared";
import { Grid3x2, Rows3, ShoppingBag } from "lucide-react";
import React from "react";
import { CreateCodebaseFromTemplateDialog } from "../CreateCodebaseFromTemplate";
import { TemplateFilter } from "../Filter";
import { TemplatesWarning } from "../TemplatesWarning";
import { useColumns } from "./hooks/useColumns";

export const TemplatesTable = () => {
  const columns = useColumns();

  const templatePermissions = useTemplatePermissions();
  const templatesWatch = useTemplateWatchList();
  const templates = templatesWatch.data.array;

  const openCreateCodebaseFromTemplateDialog = useDialogOpener(CreateCodebaseFromTemplateDialog);

  const handleTemplateClick = React.useCallback(
    (template: Template) => {
      if (template) {
        openCreateCodebaseFromTemplateDialog({
          template,
        });
      }
    },
    [openCreateCodebaseFromTemplateDialog]
  );

  const errors = templatesWatch.query.error ? [templatesWatch.query.error] : undefined;

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;
  const hasAtLeastOneGitServer = gitServers?.length > 0;

  const { filterFunction } = useFilterContext();

  const { handleChangeViewMode } = useViewModeContext();

  return (
    <DataTable<Template>
      id={TABLE.TEMPLATE_LIST.id}
      name={TABLE.TEMPLATE_LIST.name}
      errors={errors}
      columns={columns}
      data={templates!}
      isLoading={templates === null && (!errors || !errors.length)}
      handleRowClick={templatePermissions.data.create.allowed ? (_event, row) => handleTemplateClick(row) : undefined}
      emptyListComponent={
        hasAtLeastOneGitServer ? (
          <TemplatesWarning />
        ) : (
          <EmptyList missingItemName={"templates"} icon={<ShoppingBag size={128} fill="#A2A7B7" />} />
        )
      }
      slots={{
        header: (
          <>
            <TemplateFilter />
            <div className="col-span-5 flex items-center justify-end">
              <Tooltip title={"Block View"}>
                <Button variant="ghost" size="icon" onClick={() => handleChangeViewMode(VIEW_MODES.GRID)}>
                  <Grid3x2 className="text-muted-foreground" />
                </Button>
              </Tooltip>
              <Tooltip title={"List View"}>
                <Button variant="ghost" size="icon" onClick={() => handleChangeViewMode(VIEW_MODES.TABLE)}>
                  <Rows3 className="text-primary" />
                </Button>
              </Tooltip>
            </div>
          </>
        ),
      }}
      filterFunction={filterFunction}
    />
  );
};
