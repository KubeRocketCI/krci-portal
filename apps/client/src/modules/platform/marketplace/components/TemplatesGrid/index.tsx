import { DataGrid } from "@/core/components/DataGrid";
import { EmptyList } from "@/core/components/EmptyList";
import { useTemplateWatchList } from "@/k8s/api/groups/KRCI/Template";
import { Template } from "@my-project/shared";
import { TemplateCard } from "./components/TemplateCard";
import { useFilterContext } from "@/core/providers/Filter/hooks";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { TemplatesWarning } from "../TemplatesWarning";
import { CreateCodebaseFromTemplateDialog } from "../CreateCodebaseFromTemplate";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import React from "react";
import { ShoppingBag } from "lucide-react";

export const TemplatesGrid = () => {
  const templatesWatch = useTemplateWatchList();
  const templates = templatesWatch.data.array;

  const { filterFunction } = useFilterContext();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;
  const hasAtLeastOneGitServer = gitServers?.length > 0;

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

  return (
    <DataGrid<Template>
      data={templates}
      errors={templatesWatch.query.error ? [templatesWatch.query.error] : undefined}
      isLoading={!templatesWatch.isReady}
      spacing={3}
      filterFunction={filterFunction}
      emptyListComponent={
        hasAtLeastOneGitServer ? (
          <TemplatesWarning />
        ) : (
          <EmptyList missingItemName={"templates"} icon={<ShoppingBag size={128} fill="#A2A7B7" />} />
        )
      }
      renderItem={(item) => {
        const key = `marketplace-item-${item?.spec?.displayName}`;

        return (
          <div key={key} className="h-full">
            <TemplateCard handleTemplateClick={handleTemplateClick} template={item} />
          </div>
        );
      }}
    />
  );
};
