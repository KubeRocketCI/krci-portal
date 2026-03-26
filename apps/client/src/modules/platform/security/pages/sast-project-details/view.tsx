import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { Badge } from "@/core/components/ui/badge";
import { Shield } from "lucide-react";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { routeSASTProjectDetails, PATH_SAST_PROJECT_DETAILS_FULL } from "./route";
import { routeSAST } from "../sast/route";
import { useProject } from "./hooks/useProject";
import { useTabs } from "./hooks/useTabs";
import { useSonarQubeUrl } from "./hooks/useSonarQubeUrl";
import { SonarQubeMetricsList } from "../../components/sonarqube/SonarQubeMetricsList";

export default function SASTProjectDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const { namespace, projectKey, clusterName } = routeSASTProjectDetails.useParams();
  const { data: project, isLoading } = useProject(projectKey);
  const { baseUrl: sonarBaseUrl, getProjectUrl } = useSonarQubeUrl();
  const { handleChangeTab } = useTabsContext();

  const tabs = useTabs({
    projectKey,
    project,
    isLoading,
  });

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Security" },
        { label: "SAST" },
        {
          label: "Projects",
          route: {
            to: routeSAST.fullPath,
            params: { clusterName, namespace },
          },
        },
        { label: projectKey },
      ]}
    >
      <PageContentWrapper
        icon={Shield}
        title={projectKey}
        enableCopyTitle
        pinConfig={{
          key: `sast-project:${namespace}/${projectKey}`,
          label: projectKey,
          type: "sast-project",
          route: {
            to: PATH_SAST_PROJECT_DETAILS_FULL,
            params: { clusterName, namespace, projectKey },
          },
        }}
        description="Code quality metrics, security vulnerabilities, and technical debt analysis from SonarQube."
        extraLinks={
          <QuickLink
            name="SonarQube"
            tooltip="View in SonarQube"
            href={getProjectUrl(projectKey)}
            display="text"
            variant="link"
            size="xs"
          />
        }
        subHeader={
          !isLoading &&
          project && (
            <div className="ml-12 flex items-center justify-between gap-4">
              <div className="hidden md:block">
                <SonarQubeMetricsList
                  measures={project.measures}
                  sonarBaseUrl={sonarBaseUrl}
                  projectKey={project.key}
                  linkToExternal={true}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {project.visibility && (
                  <Badge variant={project.visibility === "public" ? "secondary" : "default"}>
                    {project.visibility.toUpperCase()}
                  </Badge>
                )}
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>Key: {project.key}</span>
                </div>
                {project.lastAnalysisDate && (
                  <div className="text-muted-foreground text-sm">
                    Last analysis:{" "}
                    {new Date(project.lastAnalysisDate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        }
        tabs={tabs}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
      />
    </PageWrapper>
  );
}
