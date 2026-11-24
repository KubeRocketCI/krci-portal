import type { LucideIcon } from "lucide-react";
import type React from "react";
import type { ReadyFleet } from "@my-project/shared";
import { ErrorContent } from "@/core/components/ErrorContent";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import type { Breadcrumb } from "@/core/components/PageWrapper/types";
import type { RequestError } from "@/core/types/global";
import { unreachableReasonLabel } from "../../constants/unreachableReason";
import { useFleet, type FleetData } from "../../hooks/useFleet";
import { FleetFreshness } from "../FleetFreshness";
import { FleetLoading, FleetNotConfigured, FleetUnreachable } from "../FleetStatePanel";

interface FleetPageProps {
  icon: LucideIcon;
  title: string;
  breadcrumbs: Breadcrumb[];
  /** Other states render their own panel. */
  children?: (fleet: ReadyFleet) => React.ReactNode;
}

/**
 * A failed tRPC read leaves the data as it was and sets `error`: it is the newer failure. An unreachable read becomes a
 * ready fleet with `refreshFailure` in useFleet.
 */
function staleReasonOf(fleet: FleetData | undefined, error: RequestError | null): string | undefined {
  if (error && fleet) return "Refresh failed";
  if (fleet?.state === "ready" && fleet.refreshFailure) {
    return `Agent Substrate unreachable: ${unreachableReasonLabel(fleet.refreshFailure)}`;
  }
  return undefined;
}

export interface FleetPageViewProps extends FleetPageProps {
  fleet?: FleetData;
  error: RequestError | null;
  /** Epoch ms of the last successful fetch; 0 before it. */
  dataUpdatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export function FleetPageView({
  icon,
  title,
  breadcrumbs,
  children,
  fleet,
  error,
  dataUpdatedAt,
  isFetching,
  onRefresh,
}: FleetPageViewProps) {
  const renderBody = (): React.ReactNode => {
    if (fleet === undefined) {
      return error ? <ErrorContent error={error} /> : <FleetLoading />;
    }

    switch (fleet.state) {
      case "notConfigured":
        return <FleetNotConfigured />;
      case "unreachable":
        return <FleetUnreachable reason={fleet.reason} />;
      case "ready":
        return children?.(fleet) ?? null;
    }
  };

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Agent Substrate" }, ...breadcrumbs]}
      headerSlot={
        <FleetFreshness
          updatedAt={fleet?.state === "ready" ? fleet.updatedAt : dataUpdatedAt}
          staleReason={staleReasonOf(fleet, error)}
          isFetching={isFetching}
          onRefresh={onRefresh}
        />
      }
    >
      <PageContentWrapper icon={icon} title={title}>
        <div className="flex flex-col gap-6 pb-8">{renderBody()}</div>
      </PageContentWrapper>
    </PageWrapper>
  );
}

export function FleetPage(props: FleetPageProps) {
  const query = useFleet();

  return (
    <FleetPageView
      {...props}
      fleet={query.data}
      error={query.error}
      dataUpdatedAt={query.dataUpdatedAt}
      isFetching={query.isFetching}
      onRefresh={() => void query.refetch()}
    />
  );
}
