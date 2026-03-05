import { Cpu, Server, Database, Workflow, Trash2, Shield } from "lucide-react";
import { Stage } from "@my-project/shared";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { PipelinePreview } from "@/core/components/PipelinePreview";
import { routeCDPipelineDetails } from "../../../route";

interface InfrastructureSectionProps {
  stage: Stage;
}

export function InfrastructureSection({ stage }: InfrastructureSectionProps) {
  const params = routeCDPipelineDetails.useParams();
  const qualityGates = stage.spec.qualityGates || [];

  return (
    <div className="p-5">
      <h4 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Cpu className="size-3" /> Infrastructure
      </h4>
      <div className="space-y-3">
        {/* Row 1: Cluster & Namespace */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-2">
              <Server className="size-3" />
              <span className="text-xs">Cluster</span>
            </div>
            <ScrollCopyText text={stage.spec.clusterName} />
          </div>
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-2">
              <Database className="size-3" />
              <span className="text-xs">Namespace</span>
            </div>
            <ScrollCopyText text={stage.spec.namespace} />
          </div>
        </div>

        {/* Row 2: Pipelines */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-2">
              <Workflow className="size-3" />
              <span className="text-xs">Deploy Pipeline</span>
            </div>
            <PipelinePreview
              pipelineName={stage.spec.triggerTemplate}
              namespace={params.namespace}
              clusterName={params.clusterName}
            />
          </div>
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-2">
              <Trash2 className="size-3" />
              <span className="text-xs">Clean Pipeline</span>
            </div>
            {stage.spec.cleanTemplate ? (
              <PipelinePreview
                pipelineName={stage.spec.cleanTemplate}
                namespace={params.namespace}
                clusterName={params.clusterName}
              />
            ) : (
              <span className="text-muted-foreground text-xs">N/A</span>
            )}
          </div>
        </div>

        {/* Row 3: Quality Gates */}
        <div>
          <div className="text-muted-foreground mb-1 flex items-center gap-2">
            <Shield className="size-3" />
            <span className="text-xs">Quality Gates</span>
          </div>
          {qualityGates.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {qualityGates.map((gate, idx) => (
                <div
                  key={idx}
                  className="bg-secondary/50 flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs"
                >
                  <span className="capitalize">{gate.qualityGateType}</span>
                  {gate.qualityGateType === "autotests" && gate.autotestName && (
                    <span className="text-muted-foreground font-mono">({gate.autotestName})</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
}
