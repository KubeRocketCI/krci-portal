import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { ChevronRight, ChevronDown, Package, AlertTriangle } from "lucide-react";
import { useDependencyGraph } from "../../hooks/useDependencyGraph";
import { DependencyGraphNode } from "@my-project/shared";

interface ProjectDependencyGraphProps {
  projectUuid: string;
  projectName: string;
  projectVersion: string;
}

interface TreeNodeProps {
  node: DependencyGraphNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const dependencies = node.directDependencies ? (JSON.parse(node.directDependencies) as DependencyGraphNode[]) : [];

  const hasChildren = dependencies.length > 0;
  const isOutdated = node.latestVersion && node.version && node.latestVersion !== node.version;

  const nodeLabel =
    node.purlCoordinates ||
    node.purl ||
    `${node.groupId ? node.groupId + " " : ""}${node.name}${node.version ? " " + node.version : ""}`;

  return (
    <div className="ml-4">
      <div className="hover:bg-muted/50 flex items-center gap-2 rounded px-2 py-1">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-muted flex h-5 w-5 items-center justify-center rounded"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="h-5 w-5" />
        )}
        <Package className="text-muted-foreground h-4 w-4 flex-shrink-0" />
        <span className="font-mono text-sm">{nodeLabel}</span>
        {isOutdated && (
          <span title={`Outdated. Latest version: ${node.latestVersion}`}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="border-muted-foreground/20 ml-2 border-l">
          {dependencies.map((dep, index) => (
            <TreeNode key={dep.uuid || `${dep.name}-${index}`} node={dep} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectDependencyGraph({ projectUuid, projectName, projectVersion }: ProjectDependencyGraphProps) {
  const { data, isLoading, error } = useDependencyGraph({ uuid: projectUuid });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependency Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground p-8 text-center text-lg">Loading dependency graph...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependency Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Error loading dependency graph:</strong> {String(error)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependency Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No dependencies found for this project.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dependency Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Project root node */}
          <div className="mb-2 border-b pb-2 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Package className="text-primary h-5 w-5" />
              <span>
                {projectName} {projectVersion}
              </span>
              <span className="text-muted-foreground text-xs">
                ({data.length} direct {data.length === 1 ? "dependency" : "dependencies"})
              </span>
            </div>
          </div>

          {/* Dependency tree */}
          <div className="max-h-[600px] overflow-auto">
            {data.map((node, index) => (
              <TreeNode key={node.uuid || `${node.name}-${index}`} node={node} level={0} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
