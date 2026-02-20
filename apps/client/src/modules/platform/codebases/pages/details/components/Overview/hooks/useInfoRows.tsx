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
import { Badge, type BadgeProps } from "@/core/components/ui/badge";
import { ResourceStatusBadge } from "@/k8s/components/ResourceStatusBadge";
import { codebaseType, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useCodebaseWatch, usePipelineNamesWatch } from "../../../hooks/data";
import { Tag, GitFork, FileText, Server, LucideIcon } from "lucide-react";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { PipelinePreview } from "@/core/components/PipelinePreview";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { routeProjectDetails } from "../../../route";

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export const getColorByType = (type: string) => {
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

const getTypeBadgeVariant = (type: string): BadgeProps["variant"] => {
  switch (type) {
    case codebaseType.application:
      return "success";
    case codebaseType.library:
      return "info";
    case codebaseType.autotest:
      return "warning";
    case codebaseType.infrastructure:
      return "info";
    case codebaseType.system:
    default:
      return "neutral";
  }
};

const renderIconWithText = (icon: string | LucideIcon | null, text: string, iconSize: number = 20): React.ReactNode => {
  const IconComponent = typeof icon === "function" ? icon : null;
  const spriteIconName = typeof icon === "string" ? icon : null;

  return (
    <div className="flex items-center gap-1.5">
      {IconComponent && <IconComponent className="text-muted-foreground h-3.5 w-3.5" />}
      {spriteIconName && (
        <UseSpriteSymbol name={spriteIconName} width={iconSize} height={iconSize} className="text-muted-foreground" />
      )}
      <span className="text-foreground text-sm">{text}</span>
    </div>
  );
};

export const useInfoRows = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const pipelineNamesWatch = usePipelineNamesWatch();
  const pipelineNames = pipelineNamesWatch.data;
  const params = routeProjectDetails.useParams();

  return React.useMemo((): GridItem[] => {
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
        versioning: { type: versioningType, startFrom },
        strategy,
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

    const languageIcon = LANGUAGE_ICON_MAPPING[lang as keyof typeof LANGUAGE_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;
    const frameworkIcon =
      framework && FRAMEWORK_ICON_MAPPING[framework as keyof typeof FRAMEWORK_ICON_MAPPING]
        ? FRAMEWORK_ICON_MAPPING[framework as keyof typeof FRAMEWORK_ICON_MAPPING]
        : null;
    const buildToolIcon =
      BUILD_TOOL_ICON_MAPPING[buildTool as keyof typeof BUILD_TOOL_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;
    const ciToolIcon = CI_TOOL_ICON_MAPPING[ciTool as keyof typeof CI_TOOL_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;

    return [
      // Row 1
      {
        label: "Status",
        content: (
          <ResourceStatusBadge
            status={codebase?.status?.status}
            detailedMessage={codebase?.status?.detailedMessage}
            statusIcon={codebaseStatusIcon}
          />
        ),
      },
      {
        label: "Type",
        content: <Badge variant={getTypeBadgeVariant(type)}>{capitalizeFirstLetter(type)}</Badge>,
      },
      {
        label: "Language",
        content: renderIconWithText(
          languageIcon,
          codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_lang)
        ),
      },
      {
        label: "Framework",
        content: renderIconWithText(
          frameworkIcon,
          framework
            ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                (_framework && capitalizeFirstLetter(_framework)) ||
                "N/A"
            : "N/A"
        ),
      },
      // Row 2
      {
        label: "Build Tool",
        content: renderIconWithText(
          buildToolIcon,
          codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)
        ),
      },
      {
        label: "CI Tool",
        content: renderIconWithText(ciToolIcon, capitalizeFirstLetter(ciTool)),
      },
      {
        label: "Versioning Type",
        content: renderIconWithText(Tag, versioningType),
      },
      {
        label: "Versioning Start From",
        content: (
          <span className="text-foreground text-sm">
            {versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver
              ? startFrom || "N/A"
              : "N/A"}
          </span>
        ),
      },
      // Row 3
      {
        label: "Strategy",
        content: renderIconWithText(GitFork, strategy),
      },
      {
        label: "Deployment Script",
        content: renderIconWithText(FileText, deploymentScript),
      },
      {
        label: "Git Server",
        content: renderIconWithText(Server, gitServer),
        colSpan: 2,
      },
      // Row 4 - Full width items
      {
        label: "Review Pipeline",
        content: pipelineNames?.reviewPipelineName ? (
          <LoadingWrapper isLoading={pipelineNamesWatch.isLoading}>
            <PipelinePreview
              pipelineName={pipelineNames.reviewPipelineName}
              namespace={params.namespace}
              clusterName={params.clusterName}
            />
          </LoadingWrapper>
        ) : null,
      },
      {
        label: "Build Pipeline",
        content: pipelineNames?.buildPipelineName ? (
          <LoadingWrapper isLoading={pipelineNamesWatch.isLoading}>
            <PipelinePreview
              pipelineName={pipelineNames.buildPipelineName}
              namespace={params.namespace}
              clusterName={params.clusterName}
            />
          </LoadingWrapper>
        ) : null,
      },
    ];
  }, [
    codebase,
    pipelineNames?.buildPipelineName,
    pipelineNames?.reviewPipelineName,
    pipelineNamesWatch.isLoading,
    params.namespace,
    params.clusterName,
  ]);
};
