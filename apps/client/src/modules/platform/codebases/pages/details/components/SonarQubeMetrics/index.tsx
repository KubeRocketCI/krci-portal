import { useTRPCClient } from "@/core/providers/trpc";
import { NoDataWidgetWrapper } from "@/core/components/NoDataWidgetWrapper";
import { Button } from "@/core/components/ui/button";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useClusterStore } from "@/k8s/store";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { NormalizedSonarQubeMetrics } from "@my-project/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bug, Copy, Frown, Globe, Lock, LockOpen, ShieldEllipsis, Smile } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { routeComponentDetails } from "../../route";
import { MetricsItem } from "./components/MetricsItem";
import { Rating } from "./components/Rating";
import { Value } from "./components/Value";

const defaultDuplicationRatings: {
  greaterThan: number;
  rating: "1.0" | "2.0" | "3.0" | "4.0" | "5.0";
}[] = [
  { greaterThan: 0, rating: "1.0" },
  { greaterThan: 3, rating: "2.0" },
  { greaterThan: 5, rating: "3.0" },
  { greaterThan: 10, rating: "4.0" },
  { greaterThan: 20, rating: "5.0" },
];

const IconProps = {
  size: 14,
  color: "#002446",
};

const getDuplicationRating = (metrics: NormalizedSonarQubeMetrics) => {
  if (!metrics) {
    return "";
  }

  if (!metrics.duplicated_lines_density) {
    return "";
  }

  let rating = "";

  for (const r of defaultDuplicationRatings) {
    if (+metrics.duplicated_lines_density >= r.greaterThan) {
      rating = r.rating;
    }
  }

  return rating;
};

const getCoverageRating = (metrics: NormalizedSonarQubeMetrics) => {
  if (!metrics) {
    return "";
  }

  if (!metrics?.coverage) {
    return "";
  }

  const number = +metrics.coverage;

  if (number >= 80) {
    return "1.0";
  }

  if (number >= 50) {
    return "3.0";
  }

  return "5.0";
};

const getIconVulnerability = (value: string) => (value === "0" ? <Lock {...IconProps} /> : <LockOpen {...IconProps} />);

const getIconCodeSmells = (value: string) => (value === "0" ? <Smile {...IconProps} /> : <Frown {...IconProps} />);

interface SonarQubeMetricsProps {
  componentName: string;
}

export const SonarMetrics = ({ componentName }: SonarQubeMetricsProps) => {
  const trpc = useTRPCClient();
  const params = routeComponentDetails.useParams();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const sonarDataQuery = useQuery({
    queryKey: ["sonarData", params.name],
    queryFn: async () => {
      const res = await trpc.krakend.getSonarQubeProject.query({
        clusterName,
        namespace: defaultNamespace,
        name: componentName,
      });
      return res;
    },
  });

  return (
    <NoDataWidgetWrapper
      hasData={!!sonarDataQuery.data?.metrics && !!sonarDataQuery.data?.baseUrl}
      isLoading={sonarDataQuery.isLoading}
      text={
        <p className="text-muted-foreground text-base">
          No metrics available.{" "}
          <Button variant="link" asChild className="p-0!">
            <Link
              to={PATH_CONFIG_SONAR_FULL}
              params={{
                clusterName,
              }}
            >
              Set up SonarQube configuration
            </Link>
          </Button>{" "}
          and enable reporting in your pipeline.
        </p>
      }
    >
      {sonarDataQuery.isLoading ? (
        <LoadingSpinner />
      ) : sonarDataQuery.data?.baseUrl ? (
        <div className="flex items-center gap-3">
          <MetricsItem
            titleIcon={<Bug {...IconProps} />}
            title="Bugs"
            link={LinkCreationService.sonar.createLinkByIssueType({
              baseURL: sonarDataQuery.data!.baseUrl!,
              codebaseName: params.name,
              issueType: "BUG",
            })}
            rightSlot={<Value value={sonarDataQuery.data!.metrics?.bugs} />}
            leftSlot={<Rating rating={sonarDataQuery.data!.metrics?.reliability_rating} />}
          />
          <MetricsItem
            titleIcon={
              sonarDataQuery.data!.metrics?.vulnerabilities &&
              getIconVulnerability(sonarDataQuery.data!.metrics?.vulnerabilities)
            }
            title="Vulnerabilities"
            link={
              sonarDataQuery.data!.baseUrl &&
              LinkCreationService.sonar.createLinkByIssueType({
                baseURL: sonarDataQuery.data!.baseUrl,
                codebaseName: params.name,
                issueType: "VULNERABILITY",
              })
            }
            rightSlot={<Value value={sonarDataQuery.data!.metrics?.vulnerabilities} />}
            leftSlot={<Rating rating={sonarDataQuery.data!.metrics?.security_rating} />}
          />
          <MetricsItem
            titleIcon={
              sonarDataQuery.data!.metrics?.code_smells && getIconCodeSmells(sonarDataQuery.data!.metrics?.code_smells)
            }
            title="Code Smells"
            link={
              sonarDataQuery.data!.baseUrl &&
              LinkCreationService.sonar.createLinkByIssueType({
                baseURL: sonarDataQuery.data!.baseUrl,
                codebaseName: params.name,
                issueType: "CODE_SMELL",
              })
            }
            rightSlot={<Value value={sonarDataQuery.data!.metrics?.code_smells} />}
            leftSlot={<Rating rating={sonarDataQuery.data!.metrics?.sqale_rating} />}
          />
          {sonarDataQuery.data!.metrics?.security_review_rating && (
            <MetricsItem
              titleIcon={<ShieldEllipsis {...IconProps} />}
              title="Hotspots Reviewed"
              link={undefined}
              rightSlot={
                <Value
                  value={
                    sonarDataQuery.data!.metrics?.security_hotspots_reviewed
                      ? `${sonarDataQuery.data!.metrics?.security_hotspots_reviewed}%`
                      : "—"
                  }
                />
              }
              leftSlot={<Rating rating={sonarDataQuery.data!.metrics?.security_review_rating} />}
            />
          )}
          <MetricsItem
            titleIcon={<Globe {...IconProps} />}
            link={LinkCreationService.sonar.createLinkByMetricName({
              baseURL: sonarDataQuery.data!.baseUrl!,
              codebaseName: params.name,
              metricName: "Coverage",
            })}
            title="Coverage"
            leftSlot={<Rating rating={getCoverageRating(sonarDataQuery.data!.metrics)} hideValue />}
            rightSlot={
              <Value
                value={
                  sonarDataQuery.data!.metrics?.coverage !== undefined
                    ? `${sonarDataQuery.data!.metrics?.coverage}%`
                    : "—"
                }
              />
            }
          />
          <MetricsItem
            titleIcon={<Copy {...IconProps} />}
            title="Duplications"
            link={LinkCreationService.sonar.createLinkByMetricName({
              baseURL: sonarDataQuery.data!.baseUrl!,
              codebaseName: params.name,
              metricName: "Duplications",
            })}
            leftSlot={<Rating rating={getDuplicationRating(sonarDataQuery.data!.metrics)} hideValue />}
            rightSlot={<Value value={`${sonarDataQuery.data!.metrics?.duplicated_lines_density}%`} />}
          />
        </div>
      ) : null}
    </NoDataWidgetWrapper>
  );
};
