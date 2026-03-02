import { CircleHelp } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { TOURS_CONFIG, useAutoTour, useTours } from "@/modules/tours";
import { isTourEligible } from "@/modules/tours/utils";
import { router } from "@/core/router";
import type { TourActivationContext } from "@/modules/tours/types";

interface PageGuideButtonProps {
  /** Tour ID from TOURS_CONFIG */
  tourId: string;
}

/**
 * Button to start a page tour.
 * - Shows pulse indicator when tour not completed
 * - Auto-triggers global page guide intro hint (once)
 * - Positioned in PageWrapper headerSlot
 * - Validates tour prerequisites before starting
 */
export function PageGuideButton({ tourId }: PageGuideButtonProps) {
  const { startTour, isTourCompleted } = useTours();
  const currentRouteParams = useParams({ strict: false });
  const tour = TOURS_CONFIG[tourId];

  // Show global intro hint once (first time user encounters any Page Guide button)
  useAutoTour(TOURS_CONFIG.pageGuideIntro, 500);

  const handleClick = () => {
    if (!tour) return;

    // Build activation context
    const location = router.state.location;
    const context: TourActivationContext = {
      path: location.pathname,
      params: currentRouteParams,
      search: location.search as Record<string, unknown>,
    };

    // Validate prerequisites
    if (!isTourEligible(tour, context)) {
      console.warn(
        `Tour "${tour.title}" cannot be started - prerequisites not met.`,
        "Current context:",
        context,
        "Prerequisites:",
        tour.prerequisite
      );
      // TODO: Show user-friendly message or navigate to correct page
      return;
    }

    startTour(tour.id, tour, { type: "manual" });
  };

  // Don't render if tour doesn't exist
  if (!tour) {
    return null;
  }

  const completed = isTourCompleted(tour.id);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label="Start page tour"
      className="relative"
      data-tour="page-guide-button"
    >
      <CircleHelp size={16} />
      Page Guide
      {!completed && <span className="bg-primary absolute -top-0 -right-0 h-2 w-2 animate-pulse rounded-full" />}
    </Button>
  );
}
