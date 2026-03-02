import type { TourActivationContext, TourMetadata } from "./types";
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

/**
 * Check if a route path matches a route pattern with parameters
 * @param path - Current route path (e.g., "/c/my-cluster/projects/default/my-app")
 * @param pattern - Route pattern (e.g., "/c/:clusterName/projects/:namespace/:name")
 * @returns true if the path matches the pattern
 */
function matchRoutePattern(path: string, pattern: string): boolean {
  const pathSegments = path.split("/").filter(Boolean);
  const patternSegments = pattern.split("/").filter(Boolean);

  if (pathSegments.length !== patternSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    // Segment is a parameter (starts with :), always matches
    if (segment.startsWith(":")) {
      return true;
    }
    // Segment must match exactly
    return segment === pathSegments[index];
  });
}

/**
 * Check if a tour is eligible to run in the current context
 * @param tour - Tour metadata to check
 * @param context - Current activation context
 * @returns true if the tour can be activated
 */
export function isTourEligible(tour: TourMetadata, context: TourActivationContext): boolean {
  const { prerequisite } = tour;

  // No prerequisite means tour is always eligible
  if (!prerequisite) {
    return true;
  }

  // Check route pattern
  if (prerequisite.routePattern) {
    if (!matchRoutePattern(context.path, prerequisite.routePattern)) {
      return false;
    }
  }

  // Check required search params
  if (prerequisite.requiredSearch) {
    if (typeof prerequisite.requiredSearch === "function") {
      if (!prerequisite.requiredSearch(context.search)) {
        return false;
      }
    } else {
      // Check if all required search params are present and match
      for (const [key, value] of Object.entries(prerequisite.requiredSearch)) {
        if (context.search[key] !== value) {
          return false;
        }
      }
    }
  }

  // Run custom validator
  if (prerequisite.validator) {
    if (!prerequisite.validator(context)) {
      return false;
    }
  }

  return true;
}
