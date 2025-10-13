import { InfoRow } from "@/core/components/InfoColumns/types";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getCodebaseMappingByType, getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import {
  BUILD_TOOL_ICON_MAPPING,
  CI_TOOL_ICON_MAPPING,
  FRAMEWORK_ICON_MAPPING,
  LANGUAGE_ICON_MAPPING,
} from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { MAIN_COLOR } from "@/k8s/constants/colors";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { Chip, Grid, Tooltip, Typography } from "@mui/material";
import { DefaultTheme } from "@mui/styles/defaultTheme";
import { codebaseType, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useCodebaseWatch } from "../../../hooks/data";

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

export const useInfoRows = () => {
  const codebaseWatch = useCodebaseWatch();

  const codebase = codebaseWatch.query.data;

  return React.useMemo((): InfoRow[] => {
    if (!codebase) {
      return [];
    }

    const {
      spec: {
        ciTool,
        lang: _lang,
        framework: _framework,
        buildTool: _buildTool,
        type,
        versioning: { type: versioningType },
        strategy,
        gitUrlPath,
        deploymentScript,
        gitServer,
      },
    } = codebase;
    const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;

    const codebaseStatusIcon = getCodebaseStatusIcon(codebase);

    const lang = _lang.toLowerCase();
    const framework = _framework?.toLowerCase();
    const buildTool = _buildTool.toLowerCase();

    const codebaseMappingByLang = codebaseMapping?.[lang];

    return [
      [
        {
          label: "Status",
          text: (
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item>
                <StatusIcon
                  Icon={codebaseStatusIcon.component}
                  color={codebaseStatusIcon.color}
                  isSpinning={codebaseStatusIcon.isSpinning}
                  width={20}
                  Title={
                    <>
                      <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                        {`Status: ${codebase?.status?.status || "unknown"}`}
                      </Typography>
                      {!!codebase?.status?.detailedMessage && (
                        <Typography
                          variant={"subtitle2"}
                          sx={{
                            mt: (t) => t.typography.pxToRem(10),
                          }}
                        >
                          {codebase?.status?.detailedMessage}
                        </Typography>
                      )}
                    </>
                  }
                />
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>{codebase?.status?.status || "unknown"}</Typography>
              </Grid>
            </Grid>
          ),
        },
        {
          label: "Type",
          text: (
            <Tooltip title={"Codebase Type"}>
              <Chip sx={getChipSX(type)} size="small" variant="outlined" label={capitalizeFirstLetter(type)} />
            </Tooltip>
          ),
        },
        {
          label: "Language",
          text: codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_lang),
          icon: LANGUAGE_ICON_MAPPING?.[lang as keyof typeof LANGUAGE_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER,
        },
        {
          label: "Framework",
          text: framework
            ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
              (_framework && capitalizeFirstLetter(_framework)) ||
              "N/A"
            : "N/A",
          icon: FRAMEWORK_ICON_MAPPING?.[framework as keyof typeof FRAMEWORK_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER,
        },
        {
          label: "Build Tool",
          text: codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool),
          icon:
            BUILD_TOOL_ICON_MAPPING?.[buildTool as keyof typeof BUILD_TOOL_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER,
        },
        {
          label: "CI Tool",
          text: capitalizeFirstLetter(ciTool),
          icon: CI_TOOL_ICON_MAPPING?.[ciTool as keyof typeof CI_TOOL_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER,
        },
      ],
      [
        {
          label: "Versioning Type",
          text: versioningType,
        },
        ...(versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver
          ? [
              {
                label: "Versioning Start From",
                text: codebase?.spec.versioning.startFrom || "N/A",
              },
            ]
          : []),
        {
          label: "Strategy",
          text: strategy,
        },
        {
          label: "Git URL Path",
          text: gitUrlPath || "N/A",
        },
        {
          label: "Deployment Script",
          text: deploymentScript,
        },
        {
          label: "GitServer",
          text: gitServer,
        },
      ],
      // [
      //   {
      //     label: "Review Pipeline",
      //     text: (
      //       <LoadingWrapper isLoading={pipelinesIsLoading}>
      //         <Pipeline pipelineName={pipelines?.review} namespace={namespace} />
      //       </LoadingWrapper>
      //     ),
      //   },
      //   {
      //     label: "Build Pipeline",
      //     text: (
      //       <LoadingWrapper isLoading={pipelinesIsLoading}>
      //         <Pipeline pipelineName={pipelines?.build} namespace={namespace} />
      //       </LoadingWrapper>
      //     ),
      //   },
      // ],
    ];
  }, [codebase]);
};
