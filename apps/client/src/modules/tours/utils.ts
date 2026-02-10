import type { TourMetadata } from "./types";
import { TOURS_CONFIG } from "./config";

/**
 * Get tour by ID
 */
export function getTourById(tourId: string): TourMetadata | undefined {
  return TOURS_CONFIG[tourId];
}

/**
 * Get all tours that should be shown for a given route
 */
export function getToursForRoute(route: string): TourMetadata[] {
  return Object.values(TOURS_CONFIG).filter(
    (tour) => tour.trigger === "route" && tour.routePattern && route.startsWith(tour.routePattern)
  );
}
