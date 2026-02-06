import React from "react";
import { columnNames } from "../constants";
import { QuickLink } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { TABLE } from "@/k8s/constants/tables";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { CheckCircle, SquareArrowOutUpRight, XCircle } from "lucide-react";
import { Actions } from "../components/Actions";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { sanitizeSvgBase64 } from "@/core/utils/sanitizeSvg";

export const useColumns = (): TableColumn<QuickLink>[] => {
  const { loadSettings } = useTableSettings(TABLE.QUICKLINK_LIST.id);
  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: columnNames.ICON,
        label: "Icon",
        data: {
          render: ({
            data: {
              spec: { icon },
            },
          }) => {
            const sanitizedIcon = sanitizeSvgBase64(icon);
            return (
              <span className="block shrink-0 px-5">
                <img className="size-8 shrink-0" src={`data:image/svg+xml;base64,${sanitizedIcon}`} alt="" />
              </span>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.ICON),
        },
      },
      {
        id: columnNames.NAME,
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({
            data: {
              metadata: { name },
            },
          }) => name,
        },
        cell: {
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, columnNames.NAME),
        },
      },
      {
        id: columnNames.URL,
        label: "URL",
        data: {
          render: ({
            data: {
              spec: { url },
            },
          }) => {
            const _url = !/^https?:\/\//i.test(url) ? `https://${url}` : url;

            return url ? (
              <Button asChild variant="link">
                <Link to={_url} target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-1">
                    <span>{_url} </span>
                    <SquareArrowOutUpRight className="text-muted-foreground/70" size={15} />
                  </div>
                </Link>
              </Button>
            ) : null;
          },
        },
        cell: {
          baseWidth: 60,
          ...getSyncedColumnData(tableSettings, columnNames.URL),
        },
      },
      {
        id: columnNames.VISIBLE,
        label: "Visible",
        data: {
          columnSortableValuePath: "spec.visible",
          render: ({
            data: {
              spec: { visible },
            },
          }) => (visible ? <CheckCircle size={20} /> : <XCircle size={20} />),
        },
        cell: {
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.VISIBLE),
        },
      },
      {
        id: columnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => <Actions quickLink={data} />,
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS),
        },
      },
    ],
    [tableSettings]
  );
};
