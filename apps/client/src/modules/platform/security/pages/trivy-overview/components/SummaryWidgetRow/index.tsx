import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { AlertTriangle, Shield, Box, Wrench } from "lucide-react";
import type { TrivyOverviewData } from "../../types";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/modules/platform/security/constants/severity";

export interface SummaryWidgetRowProps {
  data: TrivyOverviewData | null;
  isLoading?: boolean;
}

interface WidgetCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
  subtitle?: string;
}

function WidgetCard({ title, value, icon, color, isLoading, subtitle }: WidgetCardProps) {
  return (
    <Card className="bg-muted/30 hover:bg-muted/40 transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-bold" style={{ color }}>
                {value.toLocaleString()}
              </h4>
              <div className="rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
                {icon}
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{title}</p>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </>
        )}
      </CardHeader>
      <CardContent className="pt-0">{isLoading && <Skeleton className="h-1 w-full" />}</CardContent>
    </Card>
  );
}

/**
 * Summary widget row displaying key metrics:
 * - Total Vulnerabilities
 * - Critical Vulnerabilities
 * - Images Scanned
 * - Fixable Vulnerabilities
 */
export function SummaryWidgetRow({ data, isLoading }: SummaryWidgetRowProps) {
  const totalVulns = data?.totalVulnerabilities ?? 0;
  const criticalVulns = data?.critical ?? 0;
  const imagesScanned = data?.imagesScanned ?? 0;
  const fixableVulns = data?.fixable ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <WidgetCard
        title="Total Vulnerabilities"
        value={totalVulns}
        icon={<AlertTriangle className="size-5" style={{ color: SEVERITY_COLORS.HIGH }} />}
        color={SEVERITY_COLORS.HIGH}
        isLoading={isLoading}
      />
      <WidgetCard
        title="Critical Vulnerabilities"
        value={criticalVulns}
        icon={<Shield className="size-5" style={{ color: SEVERITY_COLORS.CRITICAL }} />}
        color={SEVERITY_COLORS.CRITICAL}
        isLoading={isLoading}
        subtitle="Requires immediate attention"
      />
      <WidgetCard
        title="Images Scanned"
        value={imagesScanned}
        icon={<Box className="size-5" style={{ color: STATUS_COLORS.INFO }} />}
        color={STATUS_COLORS.INFO}
        isLoading={isLoading}
      />
      <WidgetCard
        title="Fixable Vulnerabilities"
        value={fixableVulns}
        icon={<Wrench className="size-5" style={{ color: STATUS_COLORS.SUCCESS }} />}
        color={STATUS_COLORS.SUCCESS}
        isLoading={isLoading}
        subtitle="Fix available"
      />
    </div>
  );
}
