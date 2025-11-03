import { EmptyList } from "@/core/components/EmptyList";
import { Table } from "@/core/components/Table";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useFilterContext } from "@/core/providers/Filter/hooks";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useTemplatePermissions, useTemplateWatchList } from "@/k8s/api/groups/KRCI/Template";
import { TABLE } from "@/k8s/constants/tables";
import { IconButton, Tooltip, useTheme } from "@mui/material";
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
  const theme = useTheme();

  return (
    <Table<Template>
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
            <div className="flex items-center justify-between gap-0">
              <TemplateFilter />
              <div className="flex items-center">
                <Tooltip title={"Block View"}>
                  <IconButton onClick={() => handleChangeViewMode(VIEW_MODES.GRID)} size="large">
                    <Grid3x2 color={theme.palette.action.active} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={"List View"}>
                  <IconButton onClick={() => handleChangeViewMode(VIEW_MODES.TABLE)} size="large">
                    <Rows3 color={theme.palette.primary.main} />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </>
        ),
      }}
      filterFunction={filterFunction}
    />
  );
};
