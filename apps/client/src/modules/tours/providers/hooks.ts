import { useContext, useEffect } from "react";
import { ToursContext } from "./context";
import type { TourMetadata } from "../types";

/**
 * Hook to access tours functionality
 */
export function useTours() {
  const context = useContext(ToursContext);
  if (!context) {
    throw new Error("useTours must be used within ToursProvider");
  }
  return context;
}

/**
 * Hook to automatically show a tour based on route
 */
export function useAutoTour(tour: TourMetadata | null, delay = 1000) {
  const { startTour, isRunning } = useTours();

  useEffect(() => {
    if (!tour || isRunning) {
      return;
    }

    const timer = setTimeout(() => {
      startTour(tour.id, tour);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [tour, startTour, delay, isRunning]);
}
