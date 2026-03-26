import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/core/components/ui/dropdown-menu";
import { QuickLink } from "@/core/components/QuickLink";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Shield, ChevronDown } from "lucide-react";
import { routeSCAProjectDetails, PATH_SCA_PROJECT_DETAILS_FULL } from "./route";
import { routeSCAProjects } from "../sca-projects/route";
import { useProject } from "./hooks/useProject";
import { useProjectMetrics } from "./hooks/useProjectMetrics";
import { useTabs } from "./hooks/useTabs";
import { useDependencyTrackUrl } from "./hooks/useDependencyTrackUrl";
import { DependencyTrackMetricsList } from "../../components/dependencytrack/DependencyTrackMetricsList";
import { DependencyTrackProject } from "@my-project/shared";
import { useNavigate } from "@tanstack/react-router";

export default function SCAProjectDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeSCAProjectDetails.useParams();
  const navigate = useNavigate();
  const { namespace, projectUuid, clusterName } = params;
  const { data: project } = useProject(projectUuid);
  const { data: projectMetrics, isLoading: isMetricsLoading } = useProjectMetrics(projectUuid);
  const { getProjectUrl } = useDependencyTrackUrl();

  const tabs = useTabs({
    projectUuid,
    project,
    projectMetrics,
    isMetricsLoading,
  });

  const { handleChangeTab } = useTabsContext();

  const versions = (project?.versions || []) as DependencyTrackProject[];
  const activeVersions = versions.filter((v) => v.active);
  const inactiveVersions = versions.filter((v) => !v.active);
  const hasVersions = activeVersions.length + inactiveVersions.length > 0;

  const handleVersionChange = (versionUuid: string) => {
    navigate({
      to: PATH_SCA_PROJECT_DETAILS_FULL,
      params: {
        ...params,
        projectUuid: versionUuid,
      },
    });
  };

  const title = project ? (
    <span className="flex items-center gap-2">
      <span>{project.name}</span>
      {project.version && (
        <>
          <span className="text-muted-foreground">▸</span>
          <span className="flex items-center gap-1">
            {hasVersions ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hover:text-primary flex items-center gap-1 transition-colors">
                  <span>{project.version}</span>
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {activeVersions.map((version) => (
                    <DropdownMenuItem
                      key={version.uuid}
                      onClick={() => handleVersionChange(version.uuid)}
                      className={version.uuid === projectUuid ? "bg-accent" : ""}
                    >
                      {version.version}
                      {version.isLatest && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Latest
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {inactiveVersions.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-muted-foreground text-xs">Inactive Versions</DropdownMenuLabel>
                      {inactiveVersions.map((version) => (
                        <DropdownMenuItem
                          key={version.uuid}
                          onClick={() => handleVersionChange(version.uuid)}
                          className={version.uuid === projectUuid ? "bg-accent" : ""}
                        >
                          <span className="text-muted-foreground">{version.version}</span>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span>{project.version}</span>
            )}
          </span>
        </>
      )}
      {!project.active && <Badge variant="error">INACTIVE</Badge>}
      {project.isLatest && <Badge variant="success">LATEST</Badge>}
    </span>
  ) : (
    params.projectUuid
  );

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Security" },
        { label: "SCA" },
        {
          label: "Projects",
          route: {
            to: routeSCAProjects.fullPath,
            params: { clusterName, namespace },
          },
        },
        { label: "Project Details" },
      ]}
    >
      <PageContentWrapper
        icon={Shield}
        title={title}
        enableCopyTitle={false}
        pinConfig={{
          key: `sca-project:${namespace}/${projectUuid}`,
          label: project?.name || projectUuid,
          type: "sca-project",
          route: {
            to: PATH_SCA_PROJECT_DETAILS_FULL,
            params: { clusterName, namespace, projectUuid },
          },
        }}
        description={project?.description || "Review SCA project dependencies, vulnerabilities, and policy violations."}
        extraLinks={
          project && (
            <QuickLink
              name="Dependency Track"
              tooltip="View in Dependency Track"
              href={getProjectUrl(project.uuid)}
              display="text"
              variant="link"
              size="xs"
            />
          )
        }
        subHeader={
          project && (
            <div className="ml-12">
              <DependencyTrackMetricsList metrics={project.metrics} />
            </div>
          )
        }
        tabs={tabs}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
      >
        {/* Content is rendered by PageContentWrapper via tabs */}
      </PageContentWrapper>
    </PageWrapper>
  );
}
