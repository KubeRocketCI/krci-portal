import { PageWrapper } from "@/core/components/PageWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Badge } from "@/core/components/ui/badge";
import { routeSASTProjectDetails } from "./route";
import { routeSAST } from "../sast/route";
import { ProjectHeader } from "./components/ProjectHeader";
import { useProject } from "./hooks/useProject";
import { useTabs } from "./hooks/useTabs";

export default function SASTProjectDetailsPageContent() {
  const { namespace, projectKey, clusterName } = routeSASTProjectDetails.useParams();
  const { data: project, isLoading } = useProject(projectKey);

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
        { label: "Project Details" },
      ]}
    >
      <div className="space-y-4">
        <ProjectHeader project={project} isLoading={isLoading} />

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
                    className={`${index === 0 ? "ml-2" : "ml-1"} ${badge.className || ""}`}
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
