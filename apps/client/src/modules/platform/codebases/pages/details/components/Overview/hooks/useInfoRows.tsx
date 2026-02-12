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
import { Badge } from "@/core/components/ui/badge";
import { codebaseType, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useCodebaseWatch, usePipelineNamesWatch } from "../../../hooks/data";
import { Tag, GitFork, FileText, Server, LucideIcon } from "lucide-react";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { PipelinePreview } from "@/core/components/PipelinePreview";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { routeProjectDetails } from "../../../route";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";

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

const renderIconWithText = (icon: string | LucideIcon | null, text: string, iconSize: number = 14): React.ReactNode => {
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
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);

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
          <div className="flex items-center gap-1.5">
            {codebaseStatusIcon && (
              <StatusIcon
                Icon={codebaseStatusIcon.component}
                color={codebaseStatusIcon.color}
                isSpinning={codebaseStatusIcon.isSpinning}
                width={14}
                Title={
                  <>
                    <p className="text-sm font-semibold">{`Status: ${codebase?.status?.status || "unknown"}`}</p>
                    {!!codebase?.status?.detailedMessage && (
                      <p className="mt-3 text-sm font-medium">{codebase?.status?.detailedMessage}</p>
                    )}
                  </>
                }
              />
            )}
            <span className="text-foreground text-sm">{codebase?.status?.status || "unknown"}</span>
          </div>
        ),
      },
      {
        label: "Type",
        content: (
          <Badge variant="outline" className="text-white" style={{ backgroundColor: getColorByType(type) }}>
            {capitalizeFirstLetter(type)}
          </Badge>
        ),
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
        label: "Git URL",
        content: codebase?.status?.gitWebUrl ? (
          <ScrollCopyText text={codebase.status.gitWebUrl} />
        ) : (
          <span className="text-foreground text-sm">N/A</span>
        ),
      },
      {
        label: "Deployment Script",
        content: renderIconWithText(FileText, deploymentScript),
      },
      {
        label: "Git Server",
        content: renderIconWithText(Server, gitServer),
      },
      // Row 4 - Full width items
      {
        label: "Review Pipeline",
        content: pipelineNames?.reviewPipelineName ? (
          <LoadingWrapper isLoading={pipelineNamesWatch.isLoading}>
            <PipelinePreview
              pipelineName={pipelineNames.reviewPipelineName}
              namespace={params.namespace}
              onViewDiagram={(pipelineName, namespace) =>
                openPipelineGraphDialog({
                  pipelineName,
                  namespace,
                })
              }
            />
          </LoadingWrapper>
        ) : null,
        colSpan: 2,
      },
      {
        label: "Build Pipeline",
        content: pipelineNames?.buildPipelineName ? (
          <LoadingWrapper isLoading={pipelineNamesWatch.isLoading}>
            <PipelinePreview
              pipelineName={pipelineNames.buildPipelineName}
              namespace={params.namespace}
              onViewDiagram={(pipelineName, namespace) =>
                openPipelineGraphDialog({
                  pipelineName,
                  namespace,
                })
              }
            />
          </LoadingWrapper>
        ) : null,
        colSpan: 2,
      },
    ];
  }, [
    codebase,
    pipelineNames?.buildPipelineName,
    pipelineNames?.reviewPipelineName,
    pipelineNamesWatch.isLoading,
    params.namespace,
    openPipelineGraphDialog,
  ]);
};
