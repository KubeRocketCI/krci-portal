import type { SecurityEnvironmentApplication } from "@my-project/shared";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { SecurityCounts } from "@/modules/platform/security/components/defectdojo/SecurityCounts";
import { getSecurityErrorMessage } from "@/modules/platform/security/components/defectdojo/utils";

export interface SecurityColumnProps {
  /** Summary of the row's codebase; undefined when DefectDojo holds no runtime data for it. */
  application: SecurityEnvironmentApplication | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const SecurityColumn = ({ application, isLoading, error }: SecurityColumnProps) => {
  if (isLoading) {
    return (
      <div role="status" aria-label="Loading security findings">
        <LoadingSpinner size={16} />
      </div>
    );
  }

  if (error) {
    return (
      <span className="text-muted-foreground text-sm" title={getSecurityErrorMessage(error)}>
        Unavailable
      </span>
    );
  }

  if (!application) {
    return <span className="text-muted-foreground text-sm">Not scanned</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <SecurityCounts counts={application.counts} className="gap-x-1.5" />
      <DefectDojoLink href={application.link} label="Open runtime findings in DefectDojo" />
    </div>
  );
};
