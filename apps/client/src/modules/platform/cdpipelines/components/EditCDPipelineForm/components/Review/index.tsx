import React from "react";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Package, ArrowRight, FileText, ArrowUpCircle } from "lucide-react";
import { useChanges } from "../../hooks/useChanges";

export const Review: React.FC = () => {
  const { descriptionChange, applicationChanges, promoteChanges, hasAnyChanges } = useChanges();

  if (!hasAnyChanges) {
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

      {descriptionChange && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-foreground font-medium">Description</span>
                <Badge variant="secondary" className="bg-status-missing/10 text-status-missing">
                  Modified
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-mono text-xs">
                  {descriptionChange.oldDescription || "(empty)"}
                </Badge>
                <ArrowRight className="text-muted-foreground h-3 w-3 shrink-0" />
                <Badge variant="outline" className="font-mono text-xs">
                  {descriptionChange.newDescription || "(empty)"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {applicationChanges.length > 0 && (
        <div className="space-y-2">
          {applicationChanges.map((change) => (
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
                      <Badge variant="secondary" className="bg-status-missing/10 text-status-missing">
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
      )}

      {promoteChanges.length > 0 && (
        <div className="space-y-2">
          {promoteChanges.map((change) => (
            <Card key={`promote-${change.app}`} className="p-4">
              <div className="flex items-start gap-3">
                <ArrowUpCircle className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{change.app}</span>
                    {change.type === "added" && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Promote Enabled
                      </Badge>
                    )}
                    {change.type === "removed" && (
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                        Promote Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
