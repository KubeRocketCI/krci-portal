import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../names";
import { Card } from "@/core/components/ui/card";
import { codebaseVersioning, gitProvider } from "@my-project/shared";
import { InfoColumns } from "@/core/components/InfoColumns";
import { GridItem } from "@/core/components/InfoColumns/types";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import {
  BUILD_TOOL_ICON_MAPPING,
  CI_TOOL_ICON_MAPPING,
  FRAMEWORK_ICON_MAPPING,
  GIT_PROVIDER_ICON_MAPPING,
  LANGUAGE_ICON_MAPPING,
  RESOURCE_ICON_NAMES,
} from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import {
  Tag,
  FileText,
  Server,
  GitFork,
  MessageSquare,
  Key,
  Check,
  X,
  GitBranch,
  Sparkles,
  Settings,
} from "lucide-react";

const renderIconWithText = (
  icon: string | React.ComponentType<{ className?: string }> | null,
  text: string,
  iconSize: number = 14
): React.ReactNode => {
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

export const Review: React.FC = () => {
  const { watch } = useFormContext();

  // METHOD fields
  const ui_creationTemplate = watch(NAMES.ui_creationTemplate);
  const type = watch(NAMES.type);
  const strategy = watch(NAMES.strategy);

  // GIT_SETUP fields
  const name = watch(NAMES.name);
  const description = watch(NAMES.description);
  const gitServer = watch(NAMES.gitServer);
  const repositoryUrl = watch(NAMES.repositoryUrl);
  const gitUrlPath = watch(NAMES.gitUrlPath);
  const repositoryOwner = watch(NAMES.ui_repositoryOwner);
  const repositoryName = watch(NAMES.ui_repositoryName);
  const defaultBranch = watch(NAMES.defaultBranch);
  const privateRepo = watch(NAMES.private);
  const ui_hasCodebaseAuth = watch(NAMES.ui_hasCodebaseAuth);
  const ui_repositoryLogin = watch(NAMES.ui_repositoryLogin);
  const ui_repositoryPasswordOrApiToken = watch(NAMES.ui_repositoryPasswordOrApiToken);
  const emptyProject = watch(NAMES.emptyProject);

  // BUILD_CONFIG fields
  const lang = watch(NAMES.lang);
  const framework = watch(NAMES.framework);
  const buildTool = watch(NAMES.buildTool);
  const ciTool = watch(NAMES.ciTool);
  const testReportFramework = watch(NAMES.testReportFramework);
  const deploymentScript = watch(NAMES.deploymentScript);
  const versioningType = watch(NAMES.versioningType);
  const versioningStartFrom = watch(NAMES.versioningStartFrom);
  const ui_versioningStartFromVersion = watch(NAMES.ui_versioningStartFromVersion);
  const ui_versioningStartFromSnapshot = watch(NAMES.ui_versioningStartFromSnapshot);
  const commitMessagePattern = watch(NAMES.commitMessagePattern);
  const ui_hasJiraServerIntegration = watch(NAMES.ui_hasJiraServerIntegration);
  const jiraServer = watch(NAMES.jiraServer);
  const ticketNamePattern = watch(NAMES.ticketNamePattern);
  const ui_advancedMappingRows = watch(NAMES.ui_advancedMappingRows);
  const ui_hasCodemieIntegration = watch(NAMES.ui_hasCodemieIntegration);

  // Get git server data for URL preview
  const gitServersWatch = useGitServerWatchItem({
    name: gitServer,
  });
  const gitServerData = gitServersWatch.data;
  const gitServerProvider = gitServerData?.spec?.gitProvider;

  // Build git URL preview (similar to GitAndProjectInfo)
  const gitUrlPreview = React.useMemo(() => {
    if (repositoryUrl) {
      return repositoryUrl;
    }
    const host = gitServerData?.spec?.gitHost || "git.example.com";
    const owner = repositoryOwner || "org";
    const repo = repositoryName || "repo";
    const gitUrlPathValue = gitUrlPath || "repo";
    const isGerrit = gitServerProvider?.includes(gitProvider.gerrit);

    return isGerrit ? `${host}/${gitUrlPathValue}` : `${host}/${owner}/${repo}`;
  }, [gitServerData?.spec?.gitHost, repositoryOwner, repositoryName, gitServerProvider, gitUrlPath, repositoryUrl]);

  // Get icon mappings for lang, framework, buildTool
  const langLower = lang?.toLowerCase() || "";
  const frameworkLower = framework?.toLowerCase() || "";
  const buildToolLower = buildTool?.toLowerCase() || "";
  const ciToolLower = ciTool?.toLowerCase() || "";

  const languageIcon =
    LANGUAGE_ICON_MAPPING[langLower as keyof typeof LANGUAGE_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;
  const frameworkIcon = frameworkLower
    ? FRAMEWORK_ICON_MAPPING[frameworkLower as keyof typeof FRAMEWORK_ICON_MAPPING] || null
    : null;
  const buildToolIcon =
    BUILD_TOOL_ICON_MAPPING[buildToolLower as keyof typeof BUILD_TOOL_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;
  const ciToolIcon = CI_TOOL_ICON_MAPPING[ciToolLower as keyof typeof CI_TOOL_ICON_MAPPING] || null;

  // Get codebase mapping for display names
  const codebaseMapping = React.useMemo(() => {
    if (!type) return null;
    return getCodebaseMappingByType(type) as Record<string, CodebaseInterface> | null;
  }, [type]);

  const codebaseMappingByLang = React.useMemo(() => {
    if (!codebaseMapping || !langLower) return null;
    return codebaseMapping[langLower];
  }, [codebaseMapping, langLower]);

  const versioningDisplay = React.useMemo(() => {
    if (!versioningType) return "N/A";
    if (versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver) {
      if (versioningStartFrom) {
        return versioningStartFrom;
      }
      if (ui_versioningStartFromVersion && ui_versioningStartFromSnapshot) {
        return `${ui_versioningStartFromVersion}-${ui_versioningStartFromSnapshot}`;
      }
      if (ui_versioningStartFromVersion) {
        return ui_versioningStartFromVersion;
      }
    }
    return versioningType;
  }, [versioningType, versioningStartFrom, ui_versioningStartFromVersion, ui_versioningStartFromSnapshot]);

  const hasAdvancedJiraMapping = React.useMemo(() => {
    return ui_advancedMappingRows && Array.isArray(ui_advancedMappingRows) && ui_advancedMappingRows.length > 0;
  }, [ui_advancedMappingRows]);

  // Step 1: METHOD
  const methodStepItems: GridItem[] = React.useMemo(() => {
    const items: GridItem[] = [];
    if (ui_creationTemplate) {
      items.push({
        label: "Template",
        content: <span className="text-foreground text-sm">{ui_creationTemplate}</span>,
      });
    }
    if (strategy) {
      items.push({
        label: "Strategy",
        content: renderIconWithText(GitFork, capitalizeFirstLetter(strategy)),
      });
    }
    if (type) {
      items.push({
        label: "Type",
        content: <span className="text-foreground text-sm capitalize">{type}</span>,
      });
    }
    return items;
  }, [ui_creationTemplate, strategy, type]);

  // Get git server icon
  const gitServerIcon = React.useMemo(() => {
    if (!gitServerProvider) return null;
    return GIT_PROVIDER_ICON_MAPPING[gitServerProvider as keyof typeof GIT_PROVIDER_ICON_MAPPING] || null;
  }, [gitServerProvider]);

  // Step 2: GIT_SETUP
  const gitSetupStepItems: GridItem[] = React.useMemo(() => {
    const items: GridItem[] = [];
    if (name) {
      items.push({
        label: "Component Name",
        content: <span className="text-foreground text-sm">{name}</span>,
      });
    }
    if (description) {
      items.push({
        label: "Description",
        content: <span className="text-foreground text-sm">{description}</span>,
        colSpan: 2,
      });
    }
    if (gitServer) {
      items.push({
        label: "Git Server",
        content: renderIconWithText(gitServerIcon || Server, capitalizeFirstLetter(gitServer)),
      });
    }
    if (gitUrlPreview) {
      items.push({
        label: "Git URL",
        content: <ScrollCopyText text={gitUrlPreview} />,
        colSpan: gitUrlPreview.length > 50 ? 3 : 2,
      });
    }
    if (defaultBranch) {
      items.push({
        label: "Default Branch",
        content: renderIconWithText(GitBranch, defaultBranch),
      });
    }
    if (privateRepo !== undefined || emptyProject !== undefined) {
      items.push({
        label: "Private / Empty Project",
        content: (
          <div className="space-y-1">
            {privateRepo !== undefined && (
              <div className="flex items-center gap-1.5">
                {privateRepo ? (
                  <Check className="text-muted-foreground h-3.5 w-3.5" />
                ) : (
                  <X className="text-muted-foreground h-3.5 w-3.5" />
                )}
                <span className="text-foreground text-sm">Private: {privateRepo ? "Yes" : "No"}</span>
              </div>
            )}
            {emptyProject !== undefined && (
              <div className="flex items-center gap-1.5">
                {emptyProject ? (
                  <Check className="text-muted-foreground h-3.5 w-3.5" />
                ) : (
                  <X className="text-muted-foreground h-3.5 w-3.5" />
                )}
                <span className="text-foreground text-sm">Empty Project: {emptyProject ? "Yes" : "No"}</span>
              </div>
            )}
          </div>
        ),
      });
    }
    if (ui_hasCodebaseAuth) {
      items.push({
        label: "Repository Authentication",
        content: (
          <div className="space-y-1">
            {ui_repositoryLogin && (
              <div className="flex items-center gap-1.5">
                <Key className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-foreground text-sm">Login: {ui_repositoryLogin}</span>
              </div>
            )}
            {ui_repositoryPasswordOrApiToken && (
              <div className="flex items-center gap-1.5">
                <Key className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-foreground text-sm">Password/Token: ••••••••</span>
              </div>
            )}
          </div>
        ),
        colSpan: 2,
      });
    }
    return items;
  }, [
    name,
    description,
    gitServer,
    gitUrlPreview,
    defaultBranch,
    privateRepo,
    emptyProject,
    ui_hasCodebaseAuth,
    ui_repositoryLogin,
    ui_repositoryPasswordOrApiToken,
    gitServerIcon,
  ]);

  // Step 3: BUILD_CONFIG
  const buildConfigStepItems: GridItem[] = React.useMemo(() => {
    const items: GridItem[] = [];
    if (lang) {
      const langDisplayName = codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang);
      items.push({
        label: "Language",
        content: renderIconWithText(languageIcon, langDisplayName),
      });
    }
    if (framework) {
      const frameworkDisplayName =
        codebaseMappingByLang?.frameworks?.[frameworkLower]?.name ||
        (framework && capitalizeFirstLetter(framework)) ||
        "N/A";
      items.push({
        label: "Framework",
        content: renderIconWithText(frameworkIcon, frameworkDisplayName),
      });
    }
    if (buildTool) {
      const buildToolDisplayName =
        codebaseMappingByLang?.buildTools?.[buildToolLower]?.name || capitalizeFirstLetter(buildTool);
      items.push({
        label: "Build Tool",
        content: renderIconWithText(buildToolIcon, buildToolDisplayName),
      });
    }
    if (ciTool) {
      items.push({
        label: "CI Tool",
        content: renderIconWithText(ciToolIcon, capitalizeFirstLetter(ciTool)),
      });
    }
    if (testReportFramework) {
      items.push({
        label: "Test Report Framework",
        content: <span className="text-foreground text-sm">{testReportFramework}</span>,
      });
    }
    if (deploymentScript) {
      items.push({
        label: "Deployment Script",
        content: renderIconWithText(FileText, deploymentScript),
      });
    }
    if (versioningType) {
      items.push({
        label: "Versioning Type",
        content: renderIconWithText(Tag, capitalizeFirstLetter(versioningType)),
      });
    }
    if (versioningDisplay && versioningDisplay !== "N/A") {
      items.push({
        label: "Versioning Start From",
        content: <span className="text-foreground text-sm">{versioningDisplay}</span>,
      });
    }
    if (commitMessagePattern) {
      items.push({
        label: "Commit Message Pattern",
        content: <ScrollCopyText text={commitMessagePattern} />,
        colSpan: 2,
      });
    }
    if (ui_hasJiraServerIntegration) {
      items.push({
        label: "Jira Server Integration",
        content: (
          <div className="space-y-1">
            {jiraServer && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-foreground text-sm">Server: {jiraServer}</span>
              </div>
            )}
            {ticketNamePattern && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-foreground text-sm">Pattern: {ticketNamePattern}</span>
              </div>
            )}
            {hasAdvancedJiraMapping && (
              <div className="mt-1 space-y-0.5">
                <div className="text-muted-foreground text-xs font-medium">Advanced Mapping:</div>
                {Array.isArray(ui_advancedMappingRows) &&
                  ui_advancedMappingRows.map((row: { field: string; pattern: string }, idx: number) => (
                    <div key={idx} className="text-foreground text-xs">
                      {row.field}: <code className="text-muted-foreground">{row.pattern}</code>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ),
        colSpan: 2,
      });
    }
    if (ui_hasCodemieIntegration) {
      items.push({
        label: "Codemie Integration",
        content: <span className="text-foreground text-sm">Enabled</span>,
      });
    }
    return items;
  }, [
    lang,
    framework,
    buildTool,
    ciTool,
    testReportFramework,
    deploymentScript,
    versioningType,
    versioningDisplay,
    commitMessagePattern,
    ui_hasJiraServerIntegration,
    jiraServer,
    ticketNamePattern,
    hasAdvancedJiraMapping,
    ui_advancedMappingRows,
    ui_hasCodemieIntegration,
    languageIcon,
    frameworkIcon,
    buildToolIcon,
    ciToolIcon,
    codebaseMappingByLang,
    frameworkLower,
    buildToolLower,
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Step 1: METHOD */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Creation Method</h3>
          </div>
          <InfoColumns gridItems={methodStepItems} gridCols={5} />
        </Card>

        {/* Step 2: GIT_SETUP */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <GitBranch className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Git & Project Info</h3>
          </div>
          <InfoColumns gridItems={gitSetupStepItems} gridCols={5} />
        </Card>

        {/* Step 3: BUILD_CONFIG */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Build Configuration</h3>
          </div>
          <InfoColumns gridItems={buildConfigStepItems} gridCols={5} />
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5 p-5">
        <div className="flex gap-3">
          <Check className="text-primary mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h4 className="text-foreground mb-1 text-sm font-medium">Ready to Create</h4>
            <p className="text-muted-foreground text-sm">
              Your component will be created with the configuration above. The repository will be initialized, CI/CD
              pipeline configured, and you'll be able to start developing immediately.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
