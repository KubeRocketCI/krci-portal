import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Code } from "lucide-react";
import { ProjectWithMetrics } from "@my-project/shared";
import { SonarQubeMetricsList } from "../../../../components/sonarqube/SonarQubeMetricsList";

interface ProjectHeaderProps {
  project: ProjectWithMetrics | null | undefined;
  isLoading: boolean;
}

export function ProjectHeader({ project, isLoading }: ProjectHeaderProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-muted h-12 w-12 animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-6 w-1/3 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/4 animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">Project not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left section: Project info */}
          <div className="flex flex-1 items-start gap-4">
            {/* Project Icon */}
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded p-3">
              <Code className="text-primary-foreground h-6 w-6" />
            </div>

            {/* Project Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{project.name}</h2>

                {project.visibility && (
                  <Badge variant={project.visibility === "public" ? "secondary" : "default"}>
                    {project.visibility.toUpperCase()}
                  </Badge>
                )}
              </div>

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

          {/* Right section: Metrics badges */}
          <div className="hidden md:block">
            <SonarQubeMetricsList measures={project.measures} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
