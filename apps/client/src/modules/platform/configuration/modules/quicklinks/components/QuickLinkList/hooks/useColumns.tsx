import { Link as MuiLink, Stack } from "@mui/material";
import React from "react";
import { columnNames } from "../constants";
import { useStyles } from "../styles";
import { QuickLink } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { TABLE } from "@/k8s/constants/tables";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { CheckCircle, SquareArrowOutUpRight, XCircle } from "lucide-react";
import { Actions } from "../components/Actions";

export const useColumns = (): TableColumn<QuickLink>[] => {
  const classes = useStyles();

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
          }) => (
            <span className={classes.serviceItemIcon}>
              <img src={`data:image/svg+xml;base64,${icon}`} alt="" />
            </span>
          ),
        },
        cell: {
          isFixed: true,
          ...getSyncedColumnData(tableSettings, columnNames.ICON, 5),
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
          ...getSyncedColumnData(tableSettings, columnNames.NAME, 25),
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
              <MuiLink href={_url} target="_blank" rel="noopener">
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{_url} </span>
                  <SquareArrowOutUpRight size={15} />
                </Stack>
              </MuiLink>
            ) : null;
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.URL, 60),
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
          ...getSyncedColumnData(tableSettings, columnNames.VISIBLE, 5),
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
          customizable: false,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS, 5),
        },
      },
    ],
    [classes.serviceItemIcon, tableSettings]
  );
};
