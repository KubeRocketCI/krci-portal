import React from "react";
import { Server, Database, Workflow, Trash2, Shield } from "lucide-react";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { Stage } from "@my-project/shared";

export interface InfoColumn {
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const useInfoColumns = (stage: Stage): InfoColumn[] => {
  return React.useMemo(() => {
    const qualityGates = stage.spec.qualityGates || [];

    return [
      {
        label: "Cluster",
        icon: <Server className="size-3" />,
        content: <ScrollCopyText text={stage.spec.clusterName} />,
      },
      {
        label: "Namespace",
        icon: <Database className="size-3" />,
        content: <ScrollCopyText text={stage.spec.namespace} />,
      },
      {
        label: "Deploy Pipeline",
        icon: <Workflow className="size-3" />,
        content: <ScrollCopyText text={stage.spec.triggerTemplate} />,
      },
      {
        label: "Clean Pipeline",
        icon: <Trash2 className="size-3" />,
        content: stage.spec.cleanTemplate ? (
          <ScrollCopyText text={stage.spec.cleanTemplate} />
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        ),
      },
      {
        label: "Quality Gates",
        icon: <Shield className="size-3" />,
        content:
          qualityGates.length > 0 ? (
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
          ),
      },
    ];
  }, [
    stage.spec.clusterName,
    stage.spec.namespace,
    stage.spec.triggerTemplate,
    stage.spec.cleanTemplate,
    stage.spec.qualityGates,
  ]);
};
