import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Network, ChevronDown, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Link, useNavigate } from "@tanstack/react-router";
import { DependencyTrackProject, DependencyTrackTag } from "@my-project/shared";
import { DependencyTrackMetricsList } from "../../../../components/dependencytrack/DependencyTrackMetricsList";
import { routeSCAProjectDetails, PATH_SCA_PROJECT_DETAILS_FULL } from "../../route";
import { useDependencyTrackUrl } from "../../hooks/useDependencyTrackUrl";

interface ProjectHeaderProps {
  project: DependencyTrackProject | undefined;
  isLoading: boolean;
}

export function ProjectHeader({ project, isLoading }: ProjectHeaderProps) {
  const navigate = useNavigate();
  const params = routeSCAProjectDetails.useParams();
  const projectUuid = params.projectUuid;
  const { getProjectUrl } = useDependencyTrackUrl();

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

  const metrics = project.metrics || {};

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left section: Project info */}
          <div className="flex flex-1 items-start gap-4">
            {/* Project Icon */}
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded p-3">
              <Network className="text-primary-foreground h-6 w-6" />
            </div>

            {/* Project Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
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
                                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                                    Inactive Versions
                                  </DropdownMenuLabel>
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
                </h2>

                {!project.active && <Badge variant="destructive">INACTIVE</Badge>}

                {project.isLatest && <Badge variant="default">LATEST VERSION</Badge>}

                {/* External link to Dependency Track */}
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={getProjectUrl(project.uuid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View in Dependency Track
                  </Link>
                </Button>
              </div>

              {project.description && (
                <p className="text-muted-foreground max-w-2xl truncate text-sm">{project.description}</p>
              )}

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(project.tags as DependencyTrackTag[]).map((tag) => (
                    <Badge key={tag.name} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right section: Severity badges */}
          <div className="hidden md:block">
            <DependencyTrackMetricsList metrics={metrics} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
