import type { TourMetadata, TourTriggerInfo } from "../types";

export interface TourEndCallback {
  (tourId: string, completed: boolean): void;
}

export interface ToursContextValue {
  /** Start a specific tour by ID */
  startTour: (tourId: string, tour: TourMetadata, trigger?: TourTriggerInfo) => void;
  /** Skip the current tour */
  skipTour: () => void;
  /** Check if a tour has been completed */
  isTourCompleted: (tourId: string) => boolean;
  /** Whether any tour is currently running */
  isRunning: boolean;
  /** Set a callback for when a tour ends */
  setOnTourEnd: (callback: TourEndCallback | null) => void;
}
