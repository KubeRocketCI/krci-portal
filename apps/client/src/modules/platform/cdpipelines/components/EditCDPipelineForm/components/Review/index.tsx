import React from "react";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Package, ArrowRight } from "lucide-react";
import { useStore } from "@tanstack/react-form";
import { useEditCDPipelineForm } from "../../providers/form/hooks";
import { useEditCDPipelineData } from "../../providers/data/hooks";
import type { EditCDPipelineFormValues } from "../../types";

type ChangeType = "added" | "removed" | "modified";

interface ApplicationChange {
  app: string;
  type: ChangeType;
  branch?: string;
  oldBranch?: string;
  newBranch?: string;
}

export const Review: React.FC = () => {
  const form = useEditCDPipelineForm();
  const { cdPipeline } = useEditCDPipelineData();

  const formValues = useStore(form.store, (state) => (state as { values: EditCDPipelineFormValues }).values);

  const changes = React.useMemo(() => {
    if (!cdPipeline) return [];

    const originalApps = cdPipeline.spec.applications || [];
    const originalBranches = cdPipeline.spec.inputDockerStreams || [];
    const currentApps = formValues.applications || [];
    const currentBranches = formValues.inputDockerStreams || [];

    const applicationChanges: ApplicationChange[] = [];

    // Find added apps
    currentApps.forEach((app, index) => {
      if (!originalApps.includes(app)) {
        applicationChanges.push({
          app,
          type: "added",
          branch: currentBranches[index] || "",
        });
      }
    });

    // Find removed apps
    originalApps.forEach((app, index) => {
      if (!currentApps.includes(app)) {
        applicationChanges.push({
          app,
          type: "removed",
          branch: originalBranches[index] || "",
        });
      }
    });

    // Find modified apps (branch changed)
    currentApps.forEach((app, currentIndex) => {
      const originalIndex = originalApps.indexOf(app);
      if (originalIndex !== -1) {
        const oldBranch = originalBranches[originalIndex] || "";
        const newBranch = currentBranches[currentIndex] || "";
        if (oldBranch !== newBranch) {
          applicationChanges.push({
            app,
            type: "modified",
            oldBranch,
            newBranch,
          });
        }
      }
    });

    return applicationChanges;
  }, [cdPipeline, formValues]);

  if (changes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No changes to review</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-foreground mb-3 text-lg font-semibold">Review Changes</h3>
        <p className="text-muted-foreground text-sm">
          Please review the changes below before applying them to the deployment flow.
        </p>
      </div>

      <div className="space-y-2">
        {changes.map((change) => (
          <Card key={change.app} className="p-4">
            <div className="flex items-start gap-3">
              <Package className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-foreground font-medium">{change.app}</span>
                  {change.type === "added" && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Added
                    </Badge>
                  )}
                  {change.type === "removed" && (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                      Removed
                    </Badge>
                  )}
                  {change.type === "modified" && (
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      Modified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {change.type === "added" && (
                    <>
                      <span className="text-muted-foreground text-sm">Branch:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {change.branch}
                      </Badge>
                    </>
                  )}
                  {change.type === "removed" && (
                    <>
                      <span className="text-muted-foreground text-sm">Was using:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {change.branch}
                      </Badge>
                    </>
                  )}
                  {change.type === "modified" && (
                    <>
                      <Badge variant="outline" className="bg-background font-mono text-xs">
                        {change.oldBranch}
                      </Badge>
                      <ArrowRight className="text-muted-foreground h-3 w-3" />
                      <Badge variant="outline" className="font-mono text-xs">
                        {change.newBranch}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
