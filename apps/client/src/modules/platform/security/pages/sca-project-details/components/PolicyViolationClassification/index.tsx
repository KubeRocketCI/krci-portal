import { Shield, Scale, Layers } from "lucide-react";
import { PortfolioMetrics } from "@my-project/shared";
import { VIOLATION_COLORS } from "../../../sca/constants/colors";

interface PolicyViolationClassificationProps {
  metrics: PortfolioMetrics | null;
}

export function PolicyViolationClassification({ metrics }: PolicyViolationClassificationProps) {
  const calculatePercent = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const total = metrics?.policyViolationsTotal || 0;
  const securityCount = metrics?.policyViolationsSecurityTotal || 0;
  const licenseCount = metrics?.policyViolationsLicenseTotal || 0;
  const operationalCount = metrics?.policyViolationsOperationalTotal || 0;

  const securityPercent = calculatePercent(securityCount, total);
  const licensePercent = calculatePercent(licenseCount, total);
  const operationalPercent = calculatePercent(operationalCount, total);

  const violations = [
    {
      icon: Shield,
      label: "Security Risk",
      count: securityCount,
      percent: securityPercent,
      color: VIOLATION_COLORS.SECURITY,
    },
    {
      icon: Scale,
      label: "License Risk",
      count: licenseCount,
      percent: licensePercent,
      color: VIOLATION_COLORS.LICENSE,
    },
    {
      icon: Layers,
      label: "Operational Risk",
      count: operationalCount,
      percent: operationalPercent,
      color: VIOLATION_COLORS.OPERATIONAL,
    },
  ];

  return (
    <div className="mt-10 space-y-6">
      {violations.map((violation) => {
        const Icon = violation.icon;
        return (
          <div key={violation.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">{violation.label}</span>
              </div>
              <span className="font-bold">
                {violation.count} <span className="text-muted-foreground text-xs">({violation.percent}%)</span>
              </span>
            </div>
            {/* Custom progress bar with specific color */}
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${violation.percent}%`,
                  backgroundColor: violation.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
