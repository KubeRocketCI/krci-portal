import React from "react";
import { Copy, CopyCheck } from "lucide-react";
import { DataTable } from "@/core/components/Table";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { applicationLabels } from "@my-project/shared";
import { useCodebaseApplicationsWatch, useCodebaseStagesWatch } from "../../hooks/data";
import { routeProjectDetails } from "../../route";
import { useColumns } from "./hooks/useColumns";

export const DeploymentStatusWidget = () => {
  const params = routeProjectDetails.useParams();
  const applicationsWatch = useCodebaseApplicationsWatch();
  const stagesWatch = useCodebaseStagesWatch();
  const columns = useColumns();
  const applications = applicationsWatch.data.array;
  const clusterName = useClusterStore((state) => state.clusterName);

  const stageNamespaceMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const stage of stagesWatch.data.array) {
      map.set(`${stage.spec.cdPipeline}/${stage.spec.name}`, stage.spec.namespace);
    }
    return map;
  }, [stagesWatch.data.array]);

  const copyText = React.useMemo(() => {
    if (!applications.length) return "";

    return applications
      .map((app) => {
        const pipeline = app.metadata?.labels?.[applicationLabels.pipeline] ?? "";
        const stage = app.metadata?.labels?.[applicationLabels.stage] ?? "";
        const namespace = stageNamespaceMap.get(`${pipeline}/${stage}`) ?? "";
        const version = app.spec?.source?.targetRevision ?? "N/A";

        return [
          `cluster: ${clusterName}`,
          `deployment: ${pipeline}`,
          `environment: ${stage}`,
          `namespace: ${namespace}`,
          "",
          `${params.name}:${version}`,
        ].join("\n");
      })
      .join("\n======\n");
  }, [applications, params.name, stageNamespaceMap, clusterName]);

  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsCopied(true);
    timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-xl font-semibold">Deployments</h3>
        {applications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            {isCopied ? <CopyCheck className="size-4" /> : <Copy className="size-4" />}
            Copy deployment status
          </Button>
        )}
      </div>
      {applicationsWatch.isReady && applications.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">Not deployed to any environment</p>
      ) : (
        <DataTable
          id={TABLE.CODEBASE_DEPLOYMENTS.id}
          name={TABLE.CODEBASE_DEPLOYMENTS.name}
          isLoading={!applicationsWatch.isReady}
          data={applications}
          errors={[]}
          columns={columns}
          pagination={{ show: false }}
          settings={{ show: false }}
          outlined={false}
        />
      )}
    </Card>
  );
};
