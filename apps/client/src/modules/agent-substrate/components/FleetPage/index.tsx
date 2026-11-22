import type { LucideIcon } from "lucide-react";
import type React from "react";
import type { FleetSnapshot, ReadyFleetSnapshot } from "@my-project/shared";
import { ErrorContent } from "@/core/components/ErrorContent";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import type { Breadcrumb } from "@/core/components/PageWrapper/types";
import type { RequestError } from "@/core/types/global";
import { useFleet } from "../../hooks/useFleet";
import { FleetFreshness } from "../FleetFreshness";
import { FleetLoading, FleetNotConfigured, FleetUnreachable } from "../FleetStatePanel";

interface FleetPageProps {
  icon: LucideIcon;
  title: string;
  breadcrumbs: Breadcrumb[];
  /** Other states render their own panel. */
  children?: (fleet: ReadyFleetSnapshot) => React.ReactNode;
}

export interface FleetPageViewProps extends FleetPageProps {
  snapshot?: FleetSnapshot;
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
  snapshot,
  error,
  dataUpdatedAt,
  isFetching,
  onRefresh,
}: FleetPageViewProps) {
  const renderBody = (): React.ReactNode => {
    if (snapshot === undefined) {
      return error ? <ErrorContent error={error} /> : <FleetLoading />;
    }

    switch (snapshot.state) {
      case "notConfigured":
        return <FleetNotConfigured />;
      case "unreachable":
        return <FleetUnreachable reason={snapshot.reason} />;
      case "ready":
        return children?.(snapshot) ?? null;
    }
  };

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Agent Substrate" }, ...breadcrumbs]}
      headerSlot={
        <FleetFreshness
          updatedAt={snapshot?.state === "ready" ? snapshot.updatedAt : dataUpdatedAt}
          isStale={error !== null && snapshot !== undefined}
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
  const fleet = useFleet();

  return (
    <FleetPageView
      {...props}
      snapshot={fleet.data}
      error={fleet.error}
      dataUpdatedAt={fleet.dataUpdatedAt}
      isFetching={fleet.isFetching}
      onRefresh={() => void fleet.refetch()}
    />
  );
}
