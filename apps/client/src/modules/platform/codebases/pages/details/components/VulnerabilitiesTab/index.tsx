import { Suspense } from "react";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { lazyNamed } from "@/core/utils/lazyNamed";
import { VulnerabilitiesTabProps } from "./types";

// Content chunk (includes recharts) loads on first visit of the tab. Keep static chart imports out of this file.
const LazyContent = lazyNamed(() => import("./VulnerabilitiesTabContent"), "VulnerabilitiesTabContent");

export function VulnerabilitiesTab(props: VulnerabilitiesTabProps) {
  return (
    <div data-tour="dependencies-widget">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        }
      >
        <LazyContent {...props} />
      </Suspense>
    </div>
  );
}
