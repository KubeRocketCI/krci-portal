import { Card, CardContent } from "@/core/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { FileText, ArrowRight } from "lucide-react";
import { PATH_TRIVY_VULNERABILITIES_FULL } from "@/modules/platform/security/pages/trivy-vulnerabilities/route";

/**
 * Quick links section for navigation to related pages
 */
export function QuickLinksSection() {
  const { clusterName } = useParams({ strict: false });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Link to={PATH_TRIVY_VULNERABILITIES_FULL} params={{ clusterName: clusterName || "" }} className="group">
        <Card className="hover:border-primary/50 h-full transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/10 group-hover:bg-primary/20 rounded-lg p-3 transition-colors">
              <FileText className="text-primary size-6" />
            </div>
            <div className="flex-1">
              <h4 className="group-hover:text-primary font-semibold transition-colors">Vulnerability Reports</h4>
              <p className="text-muted-foreground text-sm">View all container vulnerability scan results</p>
            </div>
            <ArrowRight className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
