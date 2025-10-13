import { StatusIcon } from "@/core/components/StatusIcon";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Button } from "@/core/components/ui/button";
import {
  BUILD_TOOL_ICON_MAPPING,
  FRAMEWORK_ICON_MAPPING,
  LANGUAGE_ICON_MAPPING,
  RESOURCE_ICON_NAMES,
} from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { MAIN_COLOR } from "@/k8s/constants/colors";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { TABLE } from "@/k8s/constants/tables";
import { getCodebaseMappingByType, getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { Chip, Grid, Typography } from "@mui/material";
import { DefaultTheme } from "@mui/styles/defaultTheme";
import { Codebase, codebaseType } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import React from "react";
import { routeComponentDetails } from "../../../../details/route";
import { Actions } from "../../ComponentActions";
import { columnNames } from "../constants";

const getColorByType = (type: string) => {
  switch (type) {
    case codebaseType.system:
      return MAIN_COLOR.GREY;
    case codebaseType.infrastructure:
      return MAIN_COLOR.DARK_PURPLE;
    case codebaseType.application:
      return MAIN_COLOR.GREEN;
    case codebaseType.autotest:
      return MAIN_COLOR.ORANGE;
    case codebaseType.library:
      return MAIN_COLOR.BLUE;
    default:
      return MAIN_COLOR.GREY;
  }
};

const getChipSX = (type: string) => {
  const color = getColorByType(type);

  return {
    color: (t: DefaultTheme) => t.palette.common.white,
    backgroundColor: color,
    borderColor: "transparent",
  };
};

export const useColumns = (): TableColumn<Codebase>[] => {
  const { loadSettings } = useTableSettings(TABLE.COMPONENT_LIST.id);
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "status.status",
          render: ({ data }) => {
            const status = data?.status?.status;
            const detailedMessage = data?.status?.detailedMessage;

            const { component, color, isSpinning } = getCodebaseStatusIcon(data);

            const title = (
              <>
                <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                  {`Status: ${status || "Unknown"}`}
                </Typography>
                {status === CUSTOM_RESOURCE_STATUS.FAILED && (
                  <Typography variant={"subtitle2"} sx={{ marginTop: (t) => t.typography.pxToRem(10) }}>
                    {detailedMessage}
                  </Typography>
                )}
              </>
            );

            return <StatusIcon Icon={component} isSpinning={isSpinning} color={color} Title={title} />;
          },
        },
        cell: {
          isFixed: true,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS, 5),
          props: {
            align: "left",
          },
        },
      },
      {
        id: columnNames.NAME,
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({
            data: {
              metadata: { name, namespace },
            },
          }) => {
            return (
              <Button variant="link" asChild>
                <Link to={routeComponentDetails.fullPath} params={{ clusterName, namespace: namespace!, name }}>
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          customizable: false,
          ...getSyncedColumnData(tableSettings, columnNames.NAME, 20),
        },
      },
      {
        id: columnNames.TYPE,
        label: "Type",
        data: {
          columnSortableValuePath: "spec.type",
          render: ({
            data: {
              spec: { type },
            },
          }) => <Chip sx={getChipSX(type)} size="small" variant="outlined" label={capitalizeFirstLetter(type)} />,
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.TYPE, 20),
        },
      },
      {
        id: columnNames.LANGUAGE,
        label: "Language",
        data: {
          columnSortableValuePath: "spec.lang",
          render: ({
            data: {
              spec: { lang: _lang, type },
            },
          }) => {
            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const lang = _lang.toLowerCase();
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <Grid container spacing={1} alignItems={"center"} wrap={"nowrap"}>
                <Grid item>
                  <UseSpriteSymbol
                    name={
                      LANGUAGE_ICON_MAPPING?.[lang as keyof typeof LANGUAGE_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER
                    }
                    width={20}
                    height={20}
                  />
                </Grid>
                <Grid item>{codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_lang)}</Grid>
              </Grid>
            );
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.LANGUAGE, 15),
        },
      },
      {
        id: columnNames.FRAMEWORK,
        label: "Framework",
        data: {
          columnSortableValuePath: "spec.lang",
          render: ({
            data: {
              spec: { lang: _lang, framework: _framework, type },
            },
          }) => {
            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const lang = _lang.toLowerCase();
            const framework = _framework ? _framework.toLowerCase() : "N/A";
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <Grid container spacing={1} alignItems={"center"} wrap={"nowrap"}>
                <Grid item>
                  <UseSpriteSymbol
                    name={
                      FRAMEWORK_ICON_MAPPING?.[framework as keyof typeof FRAMEWORK_ICON_MAPPING] ||
                      RESOURCE_ICON_NAMES.OTHER
                    }
                    width={20}
                    height={20}
                  />
                </Grid>
                <Grid item>
                  {framework
                    ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                      (_framework && capitalizeFirstLetter(_framework)) ||
                      "N/A"
                    : "N/A"}
                </Grid>
              </Grid>
            );
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.FRAMEWORK, 15),
        },
      },
      {
        id: columnNames.BUILD_TOOL,
        label: "Build Tool",
        data: {
          columnSortableValuePath: "spec.buildTool",
          render: ({
            data: {
              spec: { lang: _lang, buildTool: _buildTool, type },
            },
          }) => {
            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const lang = _lang.toLowerCase();
            const buildTool = _buildTool.toLowerCase();
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <Grid container spacing={1} alignItems={"center"} wrap={"nowrap"}>
                <Grid item>
                  <UseSpriteSymbol
                    name={
                      BUILD_TOOL_ICON_MAPPING?.[buildTool as keyof typeof BUILD_TOOL_ICON_MAPPING] ||
                      RESOURCE_ICON_NAMES.OTHER
                    }
                    width={20}
                    height={20}
                  />
                </Grid>
                <Grid item>
                  {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
                </Grid>
              </Grid>
            );
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.BUILD_TOOL, 15),
        },
      },

      {
        id: columnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => {
            return (
              <Actions
                resource={data}
                disabled={{
                  boolean: data.spec.type === codebaseType.system,
                  reason: "System components cannot be managed",
                }}
              />
            );
          },
        },
        cell: {
          customizable: false,
          isFixed: true,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS, 5),
          props: {
            align: "center",
          },
        },
      },
    ],
    [clusterName, tableSettings]
  );
};
