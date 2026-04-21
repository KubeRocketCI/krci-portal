import { CircleHelp } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { useIsNarrow } from "@/core/hooks/use-narrow";
import { TOURS_CONFIG, useAutoTour, useTours, buildActivationContext } from "@/modules/tours";
import { isTourEligible } from "@/modules/tours/utils";

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
  const isNarrow = useIsNarrow();
  const { startTour, isTourCompleted } = useTours();
  const currentRouteParams = useParams({ strict: false });
  const tour = TOURS_CONFIG[tourId];

  // Show global intro hint once (first time user encounters any Page Guide button)
  useAutoTour(isNarrow ? null : TOURS_CONFIG.pageGuideIntro, 500);

  const handleClick = () => {
    if (!tour) return;

    const context = buildActivationContext(currentRouteParams);

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

  if (!tour || isNarrow) {
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
