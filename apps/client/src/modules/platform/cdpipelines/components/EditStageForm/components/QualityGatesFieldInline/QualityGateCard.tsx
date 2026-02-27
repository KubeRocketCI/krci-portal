import React from "react";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { CheckCircle, TestTube2, GitBranch, Workflow, Pencil, Trash2 } from "lucide-react";

type QualityGate = {
  id: string;
  qualityGateType: "manual" | "autotests";
  stepName: string;
  autotestName: string | null;
  branchName: string | null;
};

interface QualityGateCardProps {
  gate: QualityGate;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  disabled: boolean;
  canDelete: boolean;
}

export const QualityGateCard: React.FC<QualityGateCardProps> = ({
  gate,
  index,
  onEdit,
  onDelete,
  disabled,
  canDelete,
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
            {gate.qualityGateType === "manual" ? (
              <CheckCircle className="text-primary h-4 w-4" />
            ) : (
              <TestTube2 className="text-primary h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-foreground">Quality Gate #{index + 1}</span>
              <Badge variant="outline" className="capitalize">
                {gate.qualityGateType}
              </Badge>
            </div>
            {gate.qualityGateType === "autotests" && (
              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <TestTube2 className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs">Codebase:</span>
                  <span className="font-mono text-xs">{gate.autotestName || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs">Branch:</span>
                  <span className="font-mono text-xs">{gate.branchName || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Workflow className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs">Step:</span>
                  <span className="font-mono text-xs">{gate.stepName || "Not set"}</span>
                </div>
              </div>
            )}
            {gate.qualityGateType === "manual" && (
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>Manual approval required before deployment</p>
                <div className="flex items-center gap-2">
                  <Workflow className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs">Step:</span>
                  <span className="font-mono text-xs">{gate.stepName || "Not set"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(index)} disabled={disabled} type="button">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(index)}
            disabled={disabled || !canDelete}
            type="button"
          >
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
