import { Table } from "@/core/components/Table";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useClusterStore } from "@/k8s/store";
import { routeComponentDetails } from "@/modules/platform/codebases/pages/details/route";
import { IconButton, Tooltip } from "@mui/material";
import { applicationLabels } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { WidgetConfig } from "../../dialogs/AddNewWidget/types";
import { useColumns } from "./hooks/useColumns";

export const AppVersion = ({
  widgetConfig,
  userWidgets,
  setUserWidgets,
}: {
  widgetConfig: WidgetConfig<{ appName: string }>;
  userWidgets: WidgetConfig[];
  setUserWidgets: (widgets: WidgetConfig[]) => void;
}) => {
  const applicationListWatch = useApplicationWatchList({
    labels: {
      [applicationLabels.appName]: widgetConfig.data.appName,
    },
  });

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const columns = useColumns();

  const handleDeleteWidget = React.useCallback(() => {
    setUserWidgets(userWidgets.filter((el) => el.id !== widgetConfig.id));
  }, [setUserWidgets, userWidgets, widgetConfig.id]);

  const [showActions, setShowActions] = React.useState(false);

  return (
    <div
      onMouseOver={() => {
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setShowActions(false);
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-medium text-foreground">
            Deployed versions for:{" "}
            <Link
              to={routeComponentDetails.fullPath}
              params={{ clusterName: clusterName, name: widgetConfig.data.appName, namespace: defaultNamespace }}
            >
              {widgetConfig.data.appName}
            </Link>
          </h6>
          <div
            className={showActions ? "visible opacity-100" : "invisible opacity-0"}
            style={{ transition: "visibility 0.3s, opacity 0.3s" }}
          >
            <Tooltip title="Remove this widget from your dashboard.">
              <IconButton size="small" onClick={handleDeleteWidget}>
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <div className="max-h-35 overflow-y-auto">
          <Table
            minimal
            outlined={false}
            id={"appVersion"}
            data={applicationListWatch.data.array}
            isLoading={applicationListWatch.query.isLoading}
            columns={columns}
            settings={{
              show: false,
            }}
            pagination={{
              show: false,
              rowsPerPage: 100,
            }}
          />
        </div>
      </div>
    </div>
  );
};
