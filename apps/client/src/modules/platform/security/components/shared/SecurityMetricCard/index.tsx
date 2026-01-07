import { Card, CardContent } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TriangleAlert } from "lucide-react";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { SecurityMetricCardProps } from "./types";

/**
 * Reusable security metric card component
 *
 * Displays security metrics (SAST/SCA) with a consistent layout:
 * - Title with optional badge on the left
 * - Metric badges on the right
 * - Empty state with warning icon when no data available
 * - Responsive design (hides badges on mobile)
 *
 * @example
 * <SecurityMetricCard
 *   title="Code Quality (SonarQube)"
 *   badge={<QualityGateBadge status="OK" />}
 *   hasData={!!data}
 *   emptyStateMessage="No metrics available. Set up configuration."
 * >
 *   <SonarQubeMetricsList measures={data?.measures} />
 * </SecurityMetricCard>
 */
export function SecurityMetricCard({
  title,
  badge,
  children,
  isLoading,
  error,
  hasData = true,
  emptyStateMessage = "No metrics available",
}: SecurityMetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left section: Title + Badge */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-xl font-semibold">{title}</h3>
              {badge}
            </div>
          </div>

          {/* Right section: Metrics badges OR empty state */}
          {isLoading ? (
            <div className="flex items-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm">Failed to load metrics</div>
          ) : !hasData ? (
            // Empty state with warning icon (following NoDataWidgetWrapper pattern)
            <div className="flex max-w-[520px] items-center gap-2">
              <TriangleAlert size={24} color={STATUS_COLOR.UNKNOWN} className="shrink-0" />
              {typeof emptyStateMessage === "string" ? (
                <p className="text-muted-foreground text-sm">{emptyStateMessage}</p>
              ) : (
                emptyStateMessage
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-6 md:flex">{children}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
