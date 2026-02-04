import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import type { TrivyOverviewData } from "../../types";
import { SEVERITY_COLORS } from "@/modules/platform/security/constants/severity";
import { PATH_TRIVY_VULNERABILITY_DETAILS_FULL } from "@/modules/platform/security/pages/trivy-vulnerability-details/route";

export interface TopVulnerableImagesProps {
  data: TrivyOverviewData | null;
  isLoading?: boolean;
}

/**
 * Render a severity count cell with color when value > 0
 */
function SeverityCell({ count, color }: { count: number; color: string }) {
  if (count === 0) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="font-semibold" style={{ color }}>
      {count}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table showing top 10 most vulnerable images
 * Includes link to vulnerability details page
 */
export function TopVulnerableImages({ data, isLoading }: TopVulnerableImagesProps) {
  const { clusterName } = useParams({ strict: false });
  const topImages = data?.topImages ?? [];
  const hasData = topImages.length > 0;

  return (
    <Card>
      <CardHeader>
        <h4 className="text-lg font-semibold">Top Vulnerable Images</h4>
        <p className="text-muted-foreground text-sm">Images with highest vulnerability counts</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : !hasData ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center">
            No image data available
          </div>
        ) : (
          <div className="max-h-[280px] overflow-auto">
            <table className="w-full">
              <thead className="bg-card sticky top-0">
                <tr className="text-muted-foreground border-b text-left text-xs uppercase">
                  <th className="pb-2 font-medium">Image</th>
                  <th className="pb-2 text-center font-medium">Critical</th>
                  <th className="pb-2 text-center font-medium">High</th>
                  <th className="pb-2 text-center font-medium">Med</th>
                  <th className="pb-2 text-center font-medium">Low</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {topImages.map((image, index) => {
                  return (
                    <tr key={`${image.name}-${index}`} className="hover:bg-muted/30 border-b last:border-b-0">
                      <td className="py-2">
                        <Link
                          to={PATH_TRIVY_VULNERABILITY_DETAILS_FULL}
                          params={{
                            clusterName: clusterName || "",
                            namespace: image.namespace,
                            name: image.reportName,
                          }}
                          className="hover:text-primary text-sm font-medium break-all hover:underline"
                          title={image.name}
                        >
                          {image.name}
                        </Link>
                        <p className="text-muted-foreground text-xs">{image.namespace}</p>
                      </td>
                      <td className="py-2 text-center">
                        <SeverityCell count={image.critical} color={SEVERITY_COLORS.CRITICAL} />
                      </td>
                      <td className="py-2 text-center">
                        <SeverityCell count={image.high} color={SEVERITY_COLORS.HIGH} />
                      </td>
                      <td className="py-2 text-center">
                        <SeverityCell count={image.medium} color={SEVERITY_COLORS.MEDIUM} />
                      </td>
                      <td className="py-2 text-center">
                        <SeverityCell count={image.low} color={SEVERITY_COLORS.LOW} />
                      </td>
                      <td className="py-2 text-right font-semibold">{image.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
