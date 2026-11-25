import type { LucideIcon } from "lucide-react";
import type React from "react";
import type { Fleet, ReadyFleet } from "@my-project/shared";
import { ErrorContent } from "@/core/components/ErrorContent";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import type { Breadcrumb } from "@/core/components/PageWrapper/types";
import type { PinTarget } from "@/core/hooks/usePinnedItems";
import type { RequestError } from "@/core/types/global";
import { unreachableReasonLabel } from "../../constants/unreachableReason";
import { useFleet } from "../../hooks/useFleet";
import type { FactoryRead, KeptRead, KeptReadyRead } from "../../utils/keepLastReady";
import { FleetFreshness } from "../FleetFreshness";
import { FleetLoading, FleetNotConfigured, FleetUnreachable } from "../FleetStatePanel";

interface FleetPageProps {
  icon: LucideIcon;
  title: string | React.ReactElement;
  description?: string;
  breadcrumbs: Breadcrumb[];
  pinConfig?: PinTarget;
}

/**
 * A failed tRPC read leaves the data as it was and sets `error`: it is the newer failure. An unreachable read becomes a
 * ready read with `refreshFailure` in keepLastReady.
 */
function staleReasonOf<T extends FactoryRead>(
  read: KeptRead<T> | undefined,
  error: RequestError | null
): string | undefined {
  if (error && read) return "Refresh failed";
  if (read?.state === "ready") {
    const { refreshFailure } = read as KeptReadyRead<T>;
    if (refreshFailure) return `Factory unreachable: ${unreachableReasonLabel(refreshFailure)}`;
  }
  return undefined;
}

/** The connection states, freshness and errors of one Factory read (the fleet, an agent). */
export interface FleetPageViewProps<T extends FactoryRead> extends FleetPageProps {
  read?: KeptRead<T>;
  children?: (read: KeptReadyRead<T>) => React.ReactNode;
  error: RequestError | null;
  /** Epoch ms of the last successful fetch; 0 before it. */
  dataUpdatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export function FleetPageView<T extends FactoryRead>({
  icon,
  title,
  description,
  breadcrumbs,
  pinConfig,
  children,
  read,
  error,
  dataUpdatedAt,
  isFetching,
  onRefresh,
}: FleetPageViewProps<T>) {
  const renderBody = (): React.ReactNode => {
    if (read === undefined) {
      return error ? <ErrorContent error={error} /> : <FleetLoading />;
    }

    switch (read.state) {
      case "notConfigured":
        return <FleetNotConfigured />;
      case "unreachable":
        return <FleetUnreachable reason={(read as Extract<FactoryRead, { state: "unreachable" }>).reason} />;
      case "ready":
        return children?.(read as KeptReadyRead<T>) ?? null;
    }
  };

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Factory" }, ...breadcrumbs]}
      headerSlot={
        <FleetFreshness
          updatedAt={read?.state === "ready" ? (read as KeptReadyRead<T>).updatedAt : dataUpdatedAt}
          staleReason={staleReasonOf(read, error)}
          isFetching={isFetching}
          onRefresh={onRefresh}
        />
      }
    >
      <PageContentWrapper icon={icon} title={title} description={description} pinConfig={pinConfig}>
        <div className="flex flex-col gap-6 pb-8">{renderBody()}</div>
      </PageContentWrapper>
    </PageWrapper>
  );
}

export function FleetPage(props: FleetPageProps & { children?: (fleet: ReadyFleet) => React.ReactNode }) {
  const query = useFleet();

  return (
    <FleetPageView<Fleet>
      {...props}
      read={query.data}
      error={query.error}
      dataUpdatedAt={query.dataUpdatedAt}
      isFetching={query.isFetching}
      onRefresh={() => void query.refetch()}
    />
  );
}
