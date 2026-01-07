import { PageWrapper } from "@/core/components/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { routeSASTProjectDetails } from "./route";
import { routeSAST } from "../sast/route";
import { ProjectHeader } from "./components/ProjectHeader";
import { useProject } from "./hooks/useProject";

export default function SASTProjectDetailsPageContent() {
  const { namespace, projectKey, clusterName } = routeSASTProjectDetails.useParams();
  const { data: project, isLoading } = useProject(projectKey);

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

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Detailed metrics and analysis will be added here.</p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
