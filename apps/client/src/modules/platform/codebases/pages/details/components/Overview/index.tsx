import { getCodebaseMappingByType, getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import {
  BUILD_TOOL_ICON_MAPPING,
  CI_TOOL_ICON_MAPPING,
  FRAMEWORK_ICON_MAPPING,
  LANGUAGE_ICON_MAPPING,
  RESOURCE_ICON_NAMES,
} from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Card } from "@/core/components/ui/card";
import { Badge, type BadgeProps } from "@/core/components/ui/badge";
import { StatusIcon } from "@/core/components/StatusIcon";
import { PipelinePreview } from "@/core/components/PipelinePreview";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { SonarQubeMetricsWidget } from "@/modules/platform/security/components/sonarqube/SonarQubeMetricsWidget";
import { DependencyTrackMetricsWidget } from "@/modules/platform/security/components/dependencytrack/DependencyTrackMetricsWidget";
import { codebaseType, codebaseVersioning } from "@my-project/shared";
import { Code2, Wrench, GitBranch, LucideIcon } from "lucide-react";
import { useCodebaseWatch, usePipelineNamesWatch } from "../../hooks/data";
import { routeProjectDetails } from "../../route";

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
    default:
      return "neutral";
  }
};

const getTypeCardColor = (type: string): string => {
  switch (type) {
    case codebaseType.application:
      return "#22c55e";
    case codebaseType.library:
      return "#3b82f6";
    case codebaseType.autotest:
      return "#f59e0b";
    case codebaseType.infrastructure:
      return "#a855f7";
    default:
      return "#6b7280";
  }
};

const getTypeSubtitle = (type: string): string => {
  switch (type) {
    case codebaseType.application:
      return "Deployable service";
    case codebaseType.library:
      return "Shared library";
    case codebaseType.autotest:
      return "Automated tests";
    case codebaseType.infrastructure:
      return "Infrastructure code";
    default:
      return "System component";
  }
};

const SpriteOrLucideIcon = ({
  icon,
  size = 16,
  className,
}: {
  icon: string | LucideIcon | null;
  size?: number;
  className?: string;
}) => {
  if (!icon) return null;

  if (typeof icon === "function") {
    const Icon = icon;
    return <Icon width={size} height={size} className={className} />;
  }

  return <UseSpriteSymbol name={icon} width={size} height={size} className={className || ""} />;
};

const IconText = ({ icon, text }: { icon: string | LucideIcon | null; text: string }) => (
  <div className="flex items-center gap-1.5">
    <SpriteOrLucideIcon icon={icon} size={16} className="text-muted-foreground" />
    <span className="text-foreground text-sm">{text}</span>
  </div>
);

export const Overview = () => {
  const params = routeProjectDetails.useParams();
  const codebaseWatch = useCodebaseWatch();
  const pipelineNamesWatch = usePipelineNamesWatch();

  const codebase = codebaseWatch.query.data;
  const pipelineNames = pipelineNamesWatch.data;
  const defaultBranch = codebase?.spec?.defaultBranch || "main";

  if (!codebase) {
    return <LoadingWrapper isLoading={codebaseWatch.isLoading}>{null}</LoadingWrapper>;
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

  const codebaseStatusIcon = getCodebaseStatusIcon(codebase);
  const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;

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

  const typeColor = getTypeCardColor(type);
  const languageName = codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_lang);
  const frameworkName = framework
    ? codebaseMappingByLang?.frameworks?.[framework]?.name || (_framework && capitalizeFirstLetter(_framework)) || "N/A"
    : "N/A";
  const buildToolName = codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool);
  const versionStartFrom =
    versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver
      ? startFrom || "N/A"
      : "N/A";

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row - Key Info Cards */}
      <div className="grid grid-cols-4 gap-4" data-tour="overview-info">
        {/* Status */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: `${codebaseStatusIcon.color}15` }}
            >
              <StatusIcon
                Icon={codebaseStatusIcon.component}
                isSpinning={codebaseStatusIcon.isSpinning}
                color={codebaseStatusIcon.color}
                width={16}
              />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Status</div>
          </div>
          <div className="text-foreground text-lg font-semibold capitalize">{codebase.status?.status || "Unknown"}</div>
          {codebase.status?.detailedMessage && (
            <div className="text-muted-foreground mt-1 truncate text-xs">{codebase.status.detailedMessage}</div>
          )}
        </Card>

        {/* Type */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: `${typeColor}15` }}
            >
              <Code2 className="h-4 w-4" style={{ color: typeColor }} />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Type</div>
          </div>
          <div className="mb-1">
            <Badge variant={getTypeBadgeVariant(type)}>{capitalizeFirstLetter(type)}</Badge>
          </div>
          <div className="text-muted-foreground text-xs">{getTypeSubtitle(type)}</div>
        </Card>

        {/* Language */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-950">
              <SpriteOrLucideIcon icon={languageIcon} size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Language</div>
          </div>
          <div className="text-foreground text-lg font-semibold">{languageName}</div>
          <div className="text-muted-foreground mt-1 text-xs">Runtime language</div>
        </Card>

        {/* Framework */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 dark:bg-purple-950">
              {frameworkIcon ? (
                <SpriteOrLucideIcon icon={frameworkIcon} size={16} className="text-purple-600 dark:text-purple-400" />
              ) : (
                <Code2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Framework</div>
          </div>
          <div className="text-foreground text-lg font-semibold">{frameworkName}</div>
          <div className="text-muted-foreground mt-1 text-xs">Application framework</div>
        </Card>
      </div>

      {/* Bottom Row - Detail Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Build & CI Configuration */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground font-medium">Build & CI Configuration</h3>
          </div>
          <div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Build Tool</span>
              <IconText icon={buildToolIcon} text={buildToolName} />
            </div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">CI Tool</span>
              <IconText icon={ciToolIcon} text={capitalizeFirstLetter(ciTool)} />
            </div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Strategy</span>
              <span className="text-foreground text-sm">{strategy}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground text-sm">Deployment Script</span>
              <span className="text-foreground text-sm">{deploymentScript}</span>
            </div>
          </div>
        </Card>

        {/* Version Control & Pipelines */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground font-medium">Version Control & Pipelines</h3>
          </div>
          <div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Versioning Type</span>
              <span className="text-foreground font-mono text-sm">{versioningType}</span>
            </div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Versioning Start From</span>
              <span className="text-foreground font-mono text-sm">{versionStartFrom}</span>
            </div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Git Server</span>
              <span className="text-foreground text-sm">{gitServer}</span>
            </div>
            {pipelineNames?.reviewPipelineName && (
              <div className="border-border flex items-center justify-between border-b py-1.5">
                <span className="text-muted-foreground text-sm">Review Pipeline</span>
                <PipelinePreview
                  pipelineName={pipelineNames.reviewPipelineName}
                  namespace={params.namespace}
                  clusterName={params.clusterName}
                />
              </div>
            )}
            {pipelineNames?.buildPipelineName && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground text-sm">Build Pipeline</span>
                <PipelinePreview
                  pipelineName={pipelineNames.buildPipelineName}
                  namespace={params.namespace}
                  clusterName={params.clusterName}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Security Widgets */}
      <div data-tour="code-quality-widget">
        <SonarQubeMetricsWidget componentKey={params.name} />
      </div>
      <div data-tour="dependencies-widget">
        <DependencyTrackMetricsWidget projectName={params.name} defaultBranch={defaultBranch} />
      </div>
    </div>
  );
};
