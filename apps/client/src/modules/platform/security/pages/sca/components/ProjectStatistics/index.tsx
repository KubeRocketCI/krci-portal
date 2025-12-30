import { Card, CardContent } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { FolderGit2, Shield, Package, Loader2 } from "lucide-react";

export interface ProjectStatisticsProps {
  metrics?: PortfolioMetrics | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, subtitle, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
                <span className="text-muted-foreground text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">{value}</p>
                {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
              </>
            )}
          </div>
          <div className="bg-muted rounded-full p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectStatistics({ metrics, isLoading }: ProjectStatisticsProps) {
  const totalProjects = metrics?.projects ?? 0;
  const vulnerableProjects = metrics?.vulnerableProjects ?? 0;
  const totalComponents = metrics?.components ?? 0;
  const vulnerableComponents = metrics?.vulnerableComponents ?? 0;
  const totalVulnerabilities = metrics?.vulnerabilities ?? 0;
  const riskScore = metrics?.inheritedRiskScore ?? 0;

  const vulnerableProjectsPercent = totalProjects > 0 ? Math.round((vulnerableProjects / totalProjects) * 100) : 0;

  const vulnerableComponentsPercent =
    totalComponents > 0 ? Math.round((vulnerableComponents / totalComponents) * 100) : 0;

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">Portfolio Overview</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Projects"
          value={totalProjects.toLocaleString()}
          subtitle={`${vulnerableProjects} vulnerable (${vulnerableProjectsPercent}%)`}
          icon={<FolderGit2 className="text-primary size-6" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Components"
          value={totalComponents.toLocaleString()}
          subtitle={`${vulnerableComponents} vulnerable (${vulnerableComponentsPercent}%)`}
          icon={<Package className="text-primary size-6" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Vulnerabilities"
          value={totalVulnerabilities.toLocaleString()}
          subtitle={`Risk Score: ${riskScore.toLocaleString()}`}
          icon={<Shield className="text-primary size-6" />}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
