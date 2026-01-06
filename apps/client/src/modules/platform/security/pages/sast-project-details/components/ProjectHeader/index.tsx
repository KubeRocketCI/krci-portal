import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Code } from "lucide-react";
import { ProjectWithMetrics } from "@my-project/shared";
import { MetricBadge } from "../MetricBadge";
import { getRatingLabel, parsePercentage, parseCount } from "../../../sast/utils";

interface ProjectHeaderProps {
  project: ProjectWithMetrics | undefined;
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

  const measures = project.measures || {};

  // Extract and parse metrics
  const vulnerabilities = parseCount(measures.vulnerabilities);
  const vulnerabilitiesRating = getRatingLabel(measures.security_rating);

  const bugs = parseCount(measures.bugs);
  const bugsRating = getRatingLabel(measures.reliability_rating);

  const codeSmells = parseCount(measures.code_smells);
  const codeSmellsRating = getRatingLabel(measures.sqale_rating);

  const hotspotsReviewed = parsePercentage(measures.security_hotspots_reviewed);
  const hotspotsRating = getRatingLabel(measures.security_review_rating);

  const coverage = parsePercentage(measures.coverage);
  const duplications = parsePercentage(measures.duplicated_lines_density);

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
          <div className="hidden items-center gap-6 md:flex">
            <MetricBadge rating={vulnerabilitiesRating} value={vulnerabilities} label="Vulnerabilities" />
            <MetricBadge rating={bugsRating} value={bugs} label="Bugs" />
            <MetricBadge rating={codeSmellsRating} value={codeSmells} label="Code Smells" />
            <MetricBadge rating={hotspotsRating} value={hotspotsReviewed} label="Hotspots Reviewed" type="percentage" />
            <MetricBadge value={coverage} label="Coverage" type="percentage" />
            <MetricBadge value={duplications} label="Duplications" type="percentage" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
