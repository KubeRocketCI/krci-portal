import { Suspense } from "react";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { lazyPreloadable } from "@/core/utils/lazyPreloadable";
import { useVulnerabilitiesTabData } from "./hooks/useVulnerabilitiesTabData";
import { VulnerabilitiesTabProps } from "./types";

// Content chunk (includes recharts) loads on first visit of the tab or on `VulnerabilitiesTab.preload()`.
// Keep chart imports out of this file and of `hooks/`.
const LazyContent = lazyPreloadable(() => import("./VulnerabilitiesTabContent"), "VulnerabilitiesTabContent");

export function VulnerabilitiesTab(props: VulnerabilitiesTabProps) {
  const data = useVulnerabilitiesTabData(props);

  return (
    <div data-tour="dependencies-widget">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        }
      >
        <LazyContent namespace={props.namespace} clusterName={props.clusterName} {...data} />
      </Suspense>
    </div>
  );
}

VulnerabilitiesTab.preload = LazyContent.preload;
