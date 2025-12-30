import { Card, CardContent } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { XCircle, AlertTriangle, Info, FileWarning, Scale, Settings, Shield, Loader2 } from "lucide-react";
import { VIOLATION_COLORS, SEVERITY_COLORS } from "../../constants/colors";

export interface PolicyViolationsProps {
  metrics?: PortfolioMetrics | null;
  isLoading?: boolean;
}

interface ViolationCardProps {
  title: string;
  total: number;
  audited: number;
  unaudited: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function ViolationCard({ title, total, audited, unaudited, icon, color, isLoading }: ViolationCardProps) {
  const auditedPercent = total > 0 ? Math.round((audited / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm font-medium">{title}</p>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="text-muted-foreground size-5 animate-spin" />
                  <span className="text-muted-foreground text-sm">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold" style={{ color }}>
                  {total.toLocaleString()}
                </p>
              )}
            </div>
            <div className="rounded-full p-3" style={{ backgroundColor: `${color}20` }}>
              {icon}
            </div>
          </div>
          {!isLoading && total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Audited: {audited}</span>
                <span className="text-muted-foreground">Unaudited: {unaudited}</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${auditedPercent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SeverityCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function SeverityCard({ title, count, icon, color, isLoading }: SeverityCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">{title}</p>
            {isLoading ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : (
              <p className="text-xl font-bold" style={{ color }}>
                {count.toLocaleString()}
              </p>
            )}
          </div>
          <div className="rounded-full p-2" style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PolicyViolations({ metrics, isLoading }: PolicyViolationsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Policy Violations by Severity</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SeverityCard
            title="Fail"
            count={metrics?.policyViolationsFail ?? 0}
            icon={<XCircle className="size-5" style={{ color: VIOLATION_COLORS.FAIL }} />}
            color={VIOLATION_COLORS.FAIL}
            isLoading={isLoading}
          />
          <SeverityCard
            title="Warn"
            count={metrics?.policyViolationsWarn ?? 0}
            icon={<AlertTriangle className="size-5" style={{ color: VIOLATION_COLORS.WARN }} />}
            color={VIOLATION_COLORS.WARN}
            isLoading={isLoading}
          />
          <SeverityCard
            title="Info"
            count={metrics?.policyViolationsInfo ?? 0}
            icon={<Info className="size-5" style={{ color: VIOLATION_COLORS.INFO }} />}
            color={VIOLATION_COLORS.INFO}
            isLoading={isLoading}
          />
          <SeverityCard
            title="Total"
            count={metrics?.policyViolationsTotal ?? 0}
            icon={<FileWarning className="size-5" style={{ color: SEVERITY_COLORS.UNASSIGNED }} />}
            color={SEVERITY_COLORS.UNASSIGNED}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Policy Violations by Type</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ViolationCard
            title="Security"
            total={metrics?.policyViolationsSecurityTotal ?? 0}
            audited={metrics?.policyViolationsSecurityAudited ?? 0}
            unaudited={metrics?.policyViolationsSecurityUnaudited ?? 0}
            icon={<Shield className="size-6" style={{ color: VIOLATION_COLORS.SECURITY }} />}
            color={VIOLATION_COLORS.SECURITY}
            isLoading={isLoading}
          />
          <ViolationCard
            title="License"
            total={metrics?.policyViolationsLicenseTotal ?? 0}
            audited={metrics?.policyViolationsLicenseAudited ?? 0}
            unaudited={metrics?.policyViolationsLicenseUnaudited ?? 0}
            icon={<Scale className="size-6" style={{ color: VIOLATION_COLORS.LICENSE }} />}
            color={VIOLATION_COLORS.LICENSE}
            isLoading={isLoading}
          />
          <ViolationCard
            title="Operational"
            total={metrics?.policyViolationsOperationalTotal ?? 0}
            audited={metrics?.policyViolationsOperationalAudited ?? 0}
            unaudited={metrics?.policyViolationsOperationalUnaudited ?? 0}
            icon={<Settings className="size-6" style={{ color: VIOLATION_COLORS.OPERATIONAL }} />}
            color={VIOLATION_COLORS.OPERATIONAL}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
