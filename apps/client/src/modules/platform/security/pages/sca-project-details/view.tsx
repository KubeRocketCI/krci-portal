import { PageWrapper } from "@/core/components/PageWrapper";
import { routeSCAProjectDetails } from "./route";
import { routeSCAProjects } from "../sca-projects/route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Badge } from "@/core/components/ui/badge";
import { ProjectHeader } from "./components/ProjectHeader";
import { useProject } from "./hooks/useProject";
import { useProjectMetrics } from "./hooks/useProjectMetrics";
import { useEpssFindings } from "./hooks/useEpssFindings";
import { useTabs } from "./hooks/useTabs";

export default function SCAProjectDetailsPageContent() {
  const { namespace, projectUuid, clusterName } = routeSCAProjectDetails.useParams();
  const { data: project, isLoading: isProjectLoading } = useProject(projectUuid);
  const { data: projectMetrics, isLoading: isMetricsLoading } = useProjectMetrics(projectUuid);
  const { data: epssFindings } = useEpssFindings({ uuid: projectUuid });

  const tabs = useTabs({
    projectUuid,
    project,
    projectMetrics,
    isMetricsLoading,
    epssCount: epssFindings?.length || 0,
  });

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
      <div className="space-y-4">
        <ProjectHeader project={project} isLoading={isProjectLoading} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
                {tab.badges?.map((badge, index) => (
                  <Badge
                    key={index}
                    variant={badge.variant}
                    className={index === 0 ? `ml-2 ${badge.className || ""}` : `ml-1 ${badge.className || ""}`}
                  >
                    {badge.value}
                  </Badge>
                ))}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageWrapper>
  );
}
